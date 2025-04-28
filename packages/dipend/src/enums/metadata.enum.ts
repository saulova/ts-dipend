(Symbol as { metadata: symbol }).metadata ??= Symbol.for("di:metadata");

export class MetadataEnum {
  public static CLASS_METADATA = Symbol.metadata;
  public static CONSTRUCTOR_PARAM_TYPES_METADATA = Symbol.for("di:constructor:param_types");
}
