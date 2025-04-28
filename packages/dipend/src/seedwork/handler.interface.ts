export interface IHandler<InputType, OutputType> {
  handle(input: InputType): OutputType;
}
