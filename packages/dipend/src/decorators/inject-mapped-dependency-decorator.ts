import { MetadataHelper } from "../helpers";
import { MappedDependency } from "../mapped-dependency";

export function InjectMappedDependency(constructorArgIndex: number, qualifierToken: unknown) {
  return (target: any, context: ClassDecoratorContext) => {
    if (context.kind === "class") {
      context.addInitializer(function () {
        const dependencyToken = MetadataHelper.getSpecificConstructorParamsMetadata(target, constructorArgIndex);

        if (dependencyToken === undefined) {
          throw new Error("Invalid constructor argument index.");
        }

        MetadataHelper.setSpecificConstructorParamsMetadata(
          target,
          constructorArgIndex,
          new MappedDependency(dependencyToken, qualifierToken),
        );

        Object.assign(context.metadata, MetadataHelper.getAllClassMetadata(target));
      });

      return;
    }

    throw new Error("Inject just work with classes.");
  };
}
