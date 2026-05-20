import { useParams } from "react-router-dom";
import { ServicePage } from "../services/ServicePage";
import { DistrictPage } from "./DistrictPage";
import { NotFoundPage } from "../NotFoundPage";
import { MOSCOW } from "../services/servicesData";
import { getDistrict } from "./districtData";
import { getService } from "../services/servicesData";

export function MoscowSlugRouter() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <NotFoundPage />;

  if (getService(slug)) return <ServicePage city={MOSCOW} />;

  const district = getDistrict(slug);
  if (district) return <DistrictPage district={district} />;

  return <NotFoundPage />;
}
