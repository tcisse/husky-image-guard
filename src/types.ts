export interface ImageGuardConfig {
  maxSize: string | number;
  directories: string[];
  extensions: string[];
}

export interface OversizedFile {
  path: string;
  size: number;
  sizeHuman: string;
}

export interface CheckResult {
  success: boolean;
  totalChecked: number;
  oversizedFiles: OversizedFile[];
  maxSizeBytes: number;
}

export interface InitOptions {
  force?: boolean;
  interactive?: boolean;
}

export interface CliOptions {
  maxSize?: string;
  directories?: string[];
  extensions?: string[];
}
