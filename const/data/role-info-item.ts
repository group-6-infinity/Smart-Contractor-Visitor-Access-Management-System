import { User, HardHat } from "lucide-react";
import { RoleInfoItem } from "../interfaces/roles-info.interface";

export const RolesInfo:RoleInfoItem[] = [
  {
    name: 'contractor',
    icon: HardHat,
    description: 'For vendors & workers performing on site jobs, Requires KTP, BPJS, SIO / SIA & Face Photo.'
  },
  {
    name: 'visitor',
    icon: User,
    description: 'For guests, meetings & official visits. Requires KTP & a face photo for the gate pass.'
  }
]
