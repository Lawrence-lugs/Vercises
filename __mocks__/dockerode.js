// Manual mock for dockerode — used by unit tests so Docker socket is never needed.
// Vitest uses this file when the test calls vi.mock('dockerode').
'use strict';

function Docker() {}
Docker.prototype.listContainers = async () => [];
Docker.prototype.createContainer = async () => ({ attach: async () => {}, start: async () => {}, wait: async () => ({ StatusCode: 0 }), remove: async () => {}, kill: async () => {} });
Docker.prototype.getContainer = () => ({ kill: async () => {}, remove: async () => {} });

module.exports = Docker;
