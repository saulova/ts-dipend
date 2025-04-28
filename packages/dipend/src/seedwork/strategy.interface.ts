export interface IStrategy<TStrategyInput, TStrategyOutput> {
  execute(input: TStrategyInput): TStrategyOutput;
}
