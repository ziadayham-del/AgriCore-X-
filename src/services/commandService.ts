/**
 * SmartAgriculture X - Command Service
 * Central dispatcher for all physical hardware commands.
 * Implements strict state machine (IDLE -> SENDING -> ACKNOWLEDGED / FAILED / TIMEOUT),
 * safety interlock enforcement, and audit event logging.
 */
import { CommandStatus, HardwareCommandLog, FarmEvent } from '../types';

type CommandListener = (cmd: HardwareCommandLog) => void;
type EventListener = (event: FarmEvent) => void;

class CommandService {
  private activeCommands: Map<string, HardwareCommandLog> = new Map();
  private commandListeners: Set<CommandListener> = new Set();
  private eventListeners: Set<EventListener> = new Set();

  public subscribeCommand(listener: CommandListener) {
    this.commandListeners.add(listener);
    return () => this.commandListeners.delete(listener);
  }

  public subscribeEvent(listener: EventListener) {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  public logEvent(event: FarmEvent) {
    this.eventListeners.forEach(listener => listener(event));
  }

  /**
   * Executes a hardware command with strict acknowledgement and timeout tracking
   */
  public async executeCommand(params: {
    targetNode: string;
    action: string;
    payload?: any;
    timeoutMs?: number;
    safetyCheck?: () => { allowed: boolean; reason?: string };
    executor: () => Promise<boolean>;
  }): Promise<{ success: boolean; commandId: string; error?: string }> {
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timeoutMs = params.timeoutMs || 4000;

    // 1. Safety Interlock Check
    if (params.safetyCheck) {
      const check = params.safetyCheck();
      if (!check.allowed) {
        const errorMsg = check.reason || 'Command blocked by physical safety interlock';
        const failedCmd: HardwareCommandLog = {
          id: commandId,
          target: params.targetNode,
          action: params.action,
          payload: params.payload,
          status: 'failed',
          sentAt: new Date().toISOString(),
          error: errorMsg,
        };
        this.notify(failedCmd);
        return { success: false, commandId, error: errorMsg };
      }
    }

    // 2. Initial SENDING State
    const cmd: HardwareCommandLog = {
      id: commandId,
      target: params.targetNode,
      action: params.action,
      payload: params.payload,
      status: 'sending',
      sentAt: new Date().toISOString(),
    };
    this.activeCommands.set(commandId, cmd);
    this.notify(cmd);

    // 3. Dispatch to Hardware / Mock Executor with Timeout
    return new Promise((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const timeoutCmd: HardwareCommandLog = {
            ...cmd,
            status: 'timeout',
            error: `Node ${params.targetNode} did not acknowledge within ${timeoutMs}ms`,
          };
          this.activeCommands.set(commandId, timeoutCmd);
          this.notify(timeoutCmd);
          resolve({ success: false, commandId, error: timeoutCmd.error });
        }
      }, timeoutMs);

      params.executor()
        .then((result) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            if (result) {
              const ackCmd: HardwareCommandLog = {
                ...cmd,
                status: 'acknowledged',
                acknowledgedAt: new Date().toISOString(),
              };
              this.activeCommands.set(commandId, ackCmd);
              this.notify(ackCmd);
              resolve({ success: true, commandId });
            } else {
              const failCmd: HardwareCommandLog = {
                ...cmd,
                status: 'failed',
                error: `Command rejected by node ${params.targetNode}`,
              };
              this.activeCommands.set(commandId, failCmd);
              this.notify(failCmd);
              resolve({ success: false, commandId, error: failCmd.error });
            }
          }
        })
        .catch((err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            const failCmd: HardwareCommandLog = {
              ...cmd,
              status: 'failed',
              error: err instanceof Error ? err.message : 'Unknown hardware failure',
            };
            this.activeCommands.set(commandId, failCmd);
            this.notify(failCmd);
            resolve({ success: false, commandId, error: failCmd.error });
          }
        });
    });
  }

  private notify(cmd: HardwareCommandLog) {
    this.commandListeners.forEach(listener => listener(cmd));
  }
}

export const commandService = new CommandService();
