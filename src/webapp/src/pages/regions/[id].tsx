import { useRouter } from "next/router";

import { IRegion } from "@/interfaces/models/region";
import { getRegionById } from "@/store/selectors/regionsSelectors";

const Region: React.FC = () => {
  const router = useRouter();
  let region: IRegion | undefined = typeof router.query.id === "string"
    ? getRegionById(router.query.id)
    : undefined;

  return (
    <div>
      <h1 className="text-xl">{region?.name}</h1>
    </div>
  );
};

export default Region;
