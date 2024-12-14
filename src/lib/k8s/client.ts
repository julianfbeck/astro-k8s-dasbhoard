// k8sUtils.ts
import {
  KubeConfig,
  CoreV1Api,
  NetworkingV1Api,
  V1Namespace,
  V1Ingress,
  V1Service,
  V1Pod,
  AppsV1Api,
  V1Deployment,
} from "@kubernetes/client-node";
import { LABEL_SELECTOR } from "astro:env/server";
import NodeCache from "node-cache";
import { getConfig } from "../config";

const kc = new KubeConfig();
kc.loadFromDefault();

export const k8sApi = kc.makeApiClient(CoreV1Api);
export const networkingV1Api = kc.makeApiClient(NetworkingV1Api);
export const appsV1Api = kc.makeApiClient(AppsV1Api);

// Cache setup
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

export type NamespaceIngressInfo = {
  namespace: V1Namespace;
  ingressUrls: string[];
  isSpecial: boolean;
};

export type NamespaceInfo = {
  namespace: V1Namespace;
  ingressUrls: string[];
  services: V1Service[];
  deployments: V1Deployment[];
  resourceUsage: ResourceUsage;
};

export type ResourceUsage = {
  cpu: string;
  memory: string;
};

const BATCH_SIZE = 10;

export async function getK8sNamespacesWithIngress(): Promise<
  NamespaceIngressInfo[]
> {
  const cacheKey = "namespaceIngressInfo";
  const cachedData = cache.get<NamespaceIngressInfo[]>(cacheKey);
  const specialNamespaces = getConfig().SPECIAL_NAMESPACES;

  if (cachedData) {
    return cachedData.map((item) => ({
      ...item,
      ingressUrls: item.ingressUrls.map((url) => url.toString()),
    }));
  }

  try {
    // Get namespaces with label selector
    let namespaces: V1Namespace[] = [];
    let continueToken: string | undefined;
    do {
      const namespaceResponse = await k8sApi.listNamespace(
        undefined,
        undefined,
        continueToken,
        undefined,
        LABEL_SELECTOR,
        1000,
        undefined,
        undefined,
        undefined,
        30,
      );
      namespaces = namespaces.concat(namespaceResponse.body.items);
      continueToken = namespaceResponse.body.metadata?._continue;
    } while (continueToken);

    // Get special namespaces
    const specialNamespaceResponse = await Promise.all(
      specialNamespaces.map(async (namespaceName) => {
        try {
          const response = await k8sApi.readNamespace(namespaceName);
          return response.body;
        } catch (error) {
          console.warn(`Failed to fetch special namespace ${namespaceName}:`, error);
          return null;
        }
      })
    );

    // Combine labeled and special namespaces, filtering out null values
    namespaces = namespaces.concat(specialNamespaceResponse.filter((ns): ns is V1Namespace => ns !== null));

    const namespaceIngressInfos: NamespaceIngressInfo[] = [];
    for (let i = 0; i < namespaces.length; i += BATCH_SIZE) {
      const batch = namespaces.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (namespace) => {
          const namespaceName = namespace.metadata?.name;
          if (!namespaceName) {
            return { namespace, ingressUrls: [] };
          }
          const ingresses =
            await networkingV1Api.listNamespacedIngress(namespaceName);
          const ingressUrls = ingresses.body.items
            .flatMap(extractIngressUrls)
            .map((url) => url.toString());
          return {
            namespace,
            ingressUrls,
          };
        }),
      );
      namespaceIngressInfos.push(...batchResults);
    }

    cache.set(cacheKey, namespaceIngressInfos);
    return namespaceIngressInfos;
  } catch (err) {
    console.error("Error fetching namespaces and ingress URLs:", err);
    return [];
  }
}

function extractIngressUrls(ingress: V1Ingress): URL[] {
  const urls: URL[] = [];
  const rules = ingress.spec?.rules || [];
  for (const rule of rules) {
    const paths = rule.http?.paths || [];
    for (const path of paths) {
      if (rule.host && path.path) {
        const url = enrichFrontendUrl(rule.host, sanitizePath(path.path));
        if (url && removeUnnecessaryFrontendUrl(url.toString())) {
          urls.push(url);
        }
      }
    }
  }
  return urls;
}

function enrichFrontendUrl(host: string, path: string): URL | null {
  try {
    return new URL(`https://${host}${path}`);
  } catch {
    return null;
  }
}

function sanitizePath(path: string): string {
  return (
    "/" +
    path
      .replace(/^\/*/, "")
      .replace(/\*+$/, "")
      .replace(/\(.*\)/, "")
  );
}

function removeUnnecessaryFrontendUrl(url: string): boolean {
  return !url.includes("internal") && !url.includes("admin");
}

export async function getK8sNamespaceInfo(
  namespaceName: string,
): Promise<NamespaceInfo | null> {
  const cacheKey = `namespace:${namespaceName}`;
  const cachedData = cache.get<NamespaceInfo>(cacheKey);
  if (cachedData) {
    return {
      ...cachedData,
      ingressUrls: cachedData.ingressUrls.map((url) => url.toString()),
    };
  }

  try {
    const [
      namespaceResponse,
      ingressesResponse,
      servicesResponse,
      podsResponse,
      deploymentsResponse, // Added deployments response
    ] = await Promise.all([
      k8sApi.readNamespace(namespaceName),
      networkingV1Api.listNamespacedIngress(namespaceName),
      k8sApi.listNamespacedService(namespaceName),
      k8sApi.listNamespacedPod(namespaceName),
      appsV1Api.listNamespacedDeployment(namespaceName), // Added deployments request
    ]);

    const namespace = namespaceResponse.body;
    const ingressUrls =
      ingressesResponse.body.items.flatMap(extractIngressUrls).map(url => url.toString());
    const services = servicesResponse.body.items;
    const deployments = deploymentsResponse.body.items; // Added deployments
    const resourceUsage = calculateResourceUsage(podsResponse.body.items);

    const result: NamespaceInfo = {
      namespace,
      ingressUrls,
      services,
      deployments, // Added deployments
      resourceUsage,
    };

    cache.set(cacheKey, {
      ...result,
      ingressUrls: ingressUrls.map((url) => url.toString()),
    });

    return result;
  } catch (err) {
    console.error(`Error fetching data for namespace ${namespaceName}:`, err);
    return null;
  }
}

function calculateResourceUsage(pods: V1Pod[]): ResourceUsage {
  let totalCPU = 0;
  let totalMemory = 0;

  pods.forEach((pod) => {
    pod.spec?.containers.forEach((container) => {
      const cpuRequest = container.resources?.requests?.cpu;
      const memoryRequest = container.resources?.requests?.memory;

      if (cpuRequest) {
        totalCPU += parseCPU(cpuRequest);
      }
      if (memoryRequest) {
        totalMemory += parseMemory(memoryRequest);
      }
    });
  });

  return {
    cpu: `${totalCPU.toFixed(2)} cores`,
    memory: `${(totalMemory / (1024 * 1024)).toFixed(2)} Mi`,
  };
}

function parseCPU(cpu: string): number {
  if (cpu.endsWith("m")) {
    return parseInt(cpu) / 1000;
  }
  return parseInt(cpu);
}

function parseMemory(memory: string): number {
  if (memory.endsWith("Ki")) {
    return parseInt(memory) * 1024;
  }
  if (memory.endsWith("Mi")) {
    return parseInt(memory) * 1024 * 1024;
  }
  if (memory.endsWith("Gi")) {
    return parseInt(memory) * 1024 * 1024 * 1024;
  }
  return parseInt(memory);
}
