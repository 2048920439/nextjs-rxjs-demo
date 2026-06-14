import { BehaviorSubject, from, of } from "rxjs";

export type FromCaseKey = "array" | "string" | "promise" | "observable";

export type OutputLine = {
  label: string;
  value?: string;
  complete?: boolean;
};

export type FromDemoState = {
  running: boolean;
  outputs: Record<FromCaseKey, OutputLine[]>;
};

const EMPTY_OUTPUT = [{ label: "// 点击按钮查看输出" }];

const INITIAL_STATE: FromDemoState = {
  running: false,
  outputs: {
    array: EMPTY_OUTPUT,
    string: EMPTY_OUTPUT,
    promise: EMPTY_OUTPUT,
    observable: EMPTY_OUTPUT,
  },
};

export class FromDemoModel {
  private readonly stateSubject = new BehaviorSubject<FromDemoState>(INITIAL_STATE);

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  runArray() {
    const lines: OutputLine[] = [];
    from([1, 2, 3]).subscribe({
      next: (value) => lines.push({ label: "next:", value: String(value) }),
      complete: () => lines.push({ label: "//", complete: true }),
    });
    this.setOutput("array", lines);
  }

  runString() {
    const lines: OutputLine[] = [];
    from("abc").subscribe({
      next: (value) => lines.push({ label: "next:", value: String(value) }),
      complete: () => lines.push({ label: "//", complete: true }),
    });
    this.setOutput("string", lines);
  }

  resolvePromise() {
    this.patchState({ running: true });
    this.setOutput("promise", []);
    from(Promise.resolve("good")).subscribe({
      next: (value) => this.appendOutput("promise", { label: "next:", value: String(value) }),
      complete: () => {
        this.appendOutput("promise", { label: "//", complete: true });
        this.patchState({ running: false });
      },
    });
  }

  rejectPromise() {
    this.patchState({ running: true });
    this.setOutput("promise", []);
    from(Promise.reject("oops")).subscribe({
      error: (error) => {
        this.setOutput("promise", [{ label: "catch:", value: String(error) }]);
        this.patchState({ running: false });
      },
    });
  }

  runObservable() {
    const lines: OutputLine[] = [];
    from(of(1, 2, 3)).subscribe({
      next: (value) => lines.push({ label: "next:", value: String(value) }),
      complete: () => lines.push({ label: "//", complete: true }),
    });
    this.setOutput("observable", lines);
  }

  private setOutput(key: FromCaseKey, output: OutputLine[]) {
    this.patchState({ outputs: { ...this.state.outputs, [key]: output } });
  }

  private appendOutput(key: FromCaseKey, line: OutputLine) {
    this.setOutput(key, [...this.state.outputs[key], line]);
  }

  private patchState(patch: Partial<FromDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
