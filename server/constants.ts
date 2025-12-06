export const serverReplicaId = 1

/**
 * When the server receives a connect  message (not initialize), 
 * if there are too many events (>maxConnectEventCount) not observed by the client,
 * the server might not send a replicated message that contains events,
 * and instead sent a reset message that contains the whole replicated state.
 * */ 
export const maxConnectEventCount = 20 
