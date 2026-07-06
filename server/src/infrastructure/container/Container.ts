import { EventBus } from '../events/EventBus.js';
import { SyncService } from '../../services/syncService.js';
import { GeminiService } from '../../services/geminiService.js';
import { AuditService } from '../../services/auditService.js';
import { PortraitService } from '../../services/portraitService.js';
import { MeasurementService } from '../../domain/measurement/MeasurementService.js';

export class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.registerServices();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private registerServices(): void {
    // Singleton services
    this.services.set('eventBus', EventBus.getInstance());
    this.services.set('geminiService', GeminiService.getInstance());
    this.services.set('auditService', AuditService.getInstance());
    this.services.set('portraitService', PortraitService.getInstance());

    // Scoped services
    this.services.set('syncService', new SyncService());
    this.services.set('measurementService', new MeasurementService());
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }

  // Dependency injection for controllers
  resolve<T>(ServiceClass: new (...args: any[]) => T): T {
    const deps = this.getDependencies(ServiceClass);
    return new ServiceClass(...deps);
  }

  private getDependencies(ServiceClass: any): any[] {
    // Simple dependency resolution
    const paramTypes = ServiceClass.constructor?.paramTypes || [];
    return paramTypes.map((type: any) => this.get(type.name));
  }
}
