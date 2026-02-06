export interface ImageGuardConfig {
  maxSize: string | number;
  directories: string[];
  extensions: string[];
  mode: 'block' | 'resize';
}

export interface OversizedFile {
  path: string;
  size: number;
  sizeHuman: string;
}

export interface ResizedFile {
  path: string;
  originalSize: number;
  originalSizeHuman: string;
  newSize: number;
  newSizeHuman: string;
}

export interface CheckResult {
  success: boolean;
  totalChecked: number;
  oversizedFiles: OversizedFile[];
  maxSizeBytes: number;
  resizedFiles: ResizedFile[];
}

export interface InitOptions {
  force?: boolean;
  interactive?: boolean;
}

export interface CliOptions {
  maxSize?: string;
  directories?: string[];
  extensions?: string[];
  mode?: 'block' | 'resize';
}
