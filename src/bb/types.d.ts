declare interface NS {
    hack(hostname: string): Promise<number>;

    scan(hostname: string): Array<string>;
    read(filename: string): string;
    write(filename: string, data: string, mode: string): void;

    tprint(thing: any): void;

    hasRootAccess(hostname: string): Boolean;
}
