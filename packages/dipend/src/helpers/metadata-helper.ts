import { MetadataEnum } from "../enums";
import { TClassConstructor } from "../types";

export class MetadataHelper {
  private static setClassMetadataObjectIfNotExist(classConstructor: TClassConstructor) {
    classConstructor[MetadataEnum.CLASS_METADATA] ??= {};
  }

  public static getAllClassMetadata(classConstructor: TClassConstructor) {
    MetadataHelper.setClassMetadataObjectIfNotExist(classConstructor);

    return classConstructor[MetadataEnum.CLASS_METADATA];
  }

  public static getClassMetadata(classConstructor: TClassConstructor, metadata: symbol) {
    MetadataHelper.setClassMetadataObjectIfNotExist(classConstructor);

    return classConstructor[MetadataEnum.CLASS_METADATA][metadata];
  }

  public static setClassMetadata(classConstructor: TClassConstructor, metadata: symbol, value: any) {
    MetadataHelper.setClassMetadataObjectIfNotExist(classConstructor);

    classConstructor[MetadataEnum.CLASS_METADATA][metadata] = value;
  }

  public static getConstructorParamsMetadata(classConstructor: TClassConstructor) {
    return MetadataHelper.getClassMetadata(classConstructor, MetadataEnum.CONSTRUCTOR_PARAM_TYPES_METADATA);
  }

  public static getSpecificConstructorParamsMetadata(classConstructor: TClassConstructor, index: number) {
    return MetadataHelper.getClassMetadata(classConstructor, MetadataEnum.CONSTRUCTOR_PARAM_TYPES_METADATA)?.[index];
  }

  public static setConstructorParamsMetadata(classConstructor: TClassConstructor, constructorParams: Array<any>) {
    MetadataHelper.setClassMetadataObjectIfNotExist(classConstructor);

    classConstructor[MetadataEnum.CLASS_METADATA][MetadataEnum.CONSTRUCTOR_PARAM_TYPES_METADATA] = constructorParams;
  }

  public static setSpecificConstructorParamsMetadata(
    classConstructor: TClassConstructor,
    index: number,
    constructorParam: any,
  ) {
    MetadataHelper.setClassMetadataObjectIfNotExist(classConstructor);

    if (
      MetadataHelper.getClassMetadata(classConstructor, MetadataEnum.CONSTRUCTOR_PARAM_TYPES_METADATA) === undefined
    ) {
      MetadataHelper.setConstructorParamsMetadata(classConstructor, []);
    }

    classConstructor[MetadataEnum.CLASS_METADATA][MetadataEnum.CONSTRUCTOR_PARAM_TYPES_METADATA][index] =
      constructorParam;
  }
}
