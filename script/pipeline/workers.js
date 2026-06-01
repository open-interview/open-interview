import os from 'os';

export function detectOptimalWorkers() {
  const cpuCount = os.cpus().length;
  const totalMb  = Math.floor(os.totalmem() / 1024 / 1024);
  const memPerProc = parseInt(process.env.OPENCODE_MEMORY_MB || '512');
  const cpuLimit = Math.max(1, cpuCount - 1);
  const usableMb = Math.floor(totalMb * 0.8);
  const memLimit = Math.max(1, Math.floor(usableMb / memPerProc));
  return Math.max(1, Math.min(cpuLimit, memLimit));
}

export function machineSpecs() {
  const cpuCount = os.cpus().length;
  const totalGb  = (os.totalmem() / 1024 / 1024 / 1024).toFixed(0);
  const memPerProc = parseInt(process.env.OPENCODE_MEMORY_MB || '512');
  return `${cpuCount} vCPUs, ${totalGb} GB RAM — ${memPerProc} MB/proc`;
}

class ResourceMonitor {
  constructor(sampleIntervalMs = 10000) {
    this.intervalMs = sampleIntervalMs;
    this._interval = null;
    this.cpuLoad = 0;
    this.freeMemRatio = 0;
  }

  start() {
    this._sample();
    this._interval = setInterval(() => this._sample(), this.intervalMs);
  }

  stop() {
    if (this._interval) clearInterval(this._interval);
  }

  _sample() {
    this.cpuLoad = os.loadavg()[0] / os.cpus().length;
    this.freeMemRatio = os.freemem() / os.totalmem();
  }
}

export async function runWorkerPool(tasks, workerFn, initialConcurrency, onTick) {
  const results = new Array(tasks.length);
  let taskIndex = 0;
  let activeWorkers = 0;

  const cpuCount = os.cpus().length;
  const totalMb = Math.floor(os.totalmem() / 1024 / 1024);
  const memPerProc = parseInt(process.env.OPENCODE_MEMORY_MB || '512');
  const ramCap = Math.floor(totalMb * 0.8 / memPerProc);
  const maxWorkers = Math.min(cpuCount * 2, ramCap);
  const minWorkers = 1;

  let concurrency = Math.min(initialConcurrency, maxWorkers);
  const monitor = new ResourceMonitor();
  monitor.start();

  const workerLoop = async () => {
    activeWorkers++;
    while (taskIndex < tasks.length) {
      const i = taskIndex++;
      try {
        results[i] = await workerFn(tasks[i], i);
      } catch (err) {
        results[i] = { error: err.message };
      }
    }
    activeWorkers--;
  };

  const pool = Array.from({ length: Math.min(concurrency, tasks.length) }, () => workerLoop());

  const adjustInterval = setInterval(() => {
    monitor._sample();
    const cpu = monitor.cpuLoad;
    const mem = monitor.freeMemRatio;

    let action = null;

    if (cpu < 0.6 && mem > 0.3 && concurrency < maxWorkers && taskIndex < tasks.length) {
      concurrency++;
      workerLoop();
      action = '▲';
    } else if ((cpu > 0.85 || mem < 0.15) && concurrency > minWorkers) {
      concurrency--;
      action = '▼';
    }

    if (onTick) onTick({ concurrency, activeWorkers, cpuLoad: cpu, freeMem: mem, action });
  }, 10000);

  await Promise.all(pool);
  clearInterval(adjustInterval);
  monitor.stop();

  return results;
}
