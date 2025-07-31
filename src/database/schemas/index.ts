import * as authSchema from "./auth.schema";
import * as contentSchema from "./content.schema";
import * as assessmentSchema from "./assessment.schema";;
import * as enumSchema from "./enum.schema";

export const schema = {
  ...authSchema,
  ...contentSchema,
  ...assessmentSchema,
  ...enumSchema,
};

export default schema;
