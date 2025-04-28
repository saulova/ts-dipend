import ts from "typescript";

import { TransformProgram } from "./transform-program";

import {
  GetInterfacesTransform,
  DependencyContainerTransform,
  AddClassConstructorMetadataTransform,
} from "./transformation";

const interfaces: Map<ts.InterfaceDeclaration, ts.CallExpression> = new Map();

const transforms = [
  new GetInterfacesTransform(),
  new AddClassConstructorMetadataTransform(),
  new DependencyContainerTransform(),
];

transforms.forEach((transform) => transform.setInterfaces(interfaces));

const transformProgram = new TransformProgram(transforms);

const DipendPlugin = transformProgram.getHandler();

export default DipendPlugin;
