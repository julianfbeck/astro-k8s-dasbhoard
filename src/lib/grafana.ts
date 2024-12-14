import { getConfig } from "./config";

const config = getConfig();
export const getWorkloadLogsUrl = (namespace: string, deploymentName: string) =>
  `${config.GRAFANA_BASE_URL}/explore?schemaVersion=1&panes=%7B%22GCQ%22%3A%7B%22datasource%22%3A%22loki%22%2C%22queries%22%3A%5B%7B%22refId%22%3A%22A%22%2C%22expr%22%3A%22%7Bapp%3D%5C%22${deploymentName}%5C%22%2Cnamespace%3D%5C%22${namespace}%5C%22%7D%22%2C%22queryType%22%3A%22range%22%2C%22datasource%22%3A%7B%22type%22%3A%22loki%22%2C%22uid%22%3A%22loki%22%7D%7D%5D%2C%22range%22%3A%7B%22from%22%3A%22now-1h%22%2C%22to%22%3A%22now%22%7D%7D%7D&orgId=1`;

// Function to generate Grafana dashboard URL for deployments
export const getGrafanaDashboardUrl = (
  namespace: string,
  workloadName: string,
) =>
  `${config.GRAFANA_BASE_URL}/d/${config.GRAFANA_DASHBOARD_URL_DEPLOYMENT}?var-datasource=Prometheus&var-namespace=${namespace}&var-deployment=${workloadName}`;

// Function to get Namespace dashboard URL
export const getNamespaceDashboardUrl = (namespace: string) =>
  `${config.GRAFANA_BASE_URL}/d/${config.GRAFANA_DASHBOARD_URL_NAMESPACE}?var-datasource=Prometheus&var-namespace=${namespace}`;
