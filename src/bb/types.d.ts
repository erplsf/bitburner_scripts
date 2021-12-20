declare interface NS {
    getHostname(): string;
    hack(name: string): Promise<void>;
}
