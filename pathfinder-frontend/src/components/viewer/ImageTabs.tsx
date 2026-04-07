import TabBar from "../ui/TabBar";
import { useMission } from "../../context/MissionContext";

const tabs = [
  { key: "original", label: "Original" },
  { key: "segmentation", label: "Segmentation" },
  { key: "rescue", label: "Rescue Map" },
  { key: "path", label: "Path Result" },
];

export default function ImageTabs() {
  const { state, dispatch } = useMission();

  return (
    <TabBar
      tabs={tabs}
      activeKey={state.activeTab}
      onSelect={(key) =>
        dispatch({
          type: "SET_ACTIVE_TAB",
          payload: key as "original" | "segmentation" | "rescue" | "path",
        })
      }
    />
  );
}
