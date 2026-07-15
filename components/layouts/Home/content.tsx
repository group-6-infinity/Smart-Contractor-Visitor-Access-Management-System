import RoleCard from "@/components/common/role-card";
import { RolesInfo } from "@/const/data/role-info-item";
import type { RoleInfoItem } from "@/const/interfaces/roles-info.interface";

export default function Content() {
  return (
    <div
      id="main__content"
      className="main__content mt-14 grid gap-10 md:grid-cols-2"
    >
      {RolesInfo.map(({name, icon}: RoleInfoItem) => (
         <RoleCard key={name} role={name} icon={icon} />
      ))}
    </div>
  );
}
