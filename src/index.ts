import OpenRPCSpecificationSchema1_4 from "../spec/1.4/schema.json";
import OpenRPCSpecificationSchema1_3 from "../spec/1.3/schema.json";
export { OpenRPCSpecificationSchema1_4, OpenRPCSpecificationSchema1_3 };
export const getAllSchemas = () => {
  return {
  "1_4": OpenRPCSpecificationSchema1_4, 
  "1_3": OpenRPCSpecificationSchema1_3,
  }
};