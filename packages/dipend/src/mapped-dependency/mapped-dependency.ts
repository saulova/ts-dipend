export class MappedDependency<TDependencyToken, TQualifierToken> {
  constructor(
    public readonly dependencyToken: TDependencyToken,
    public readonly qualifierToken: TQualifierToken,
  ) {}
}
