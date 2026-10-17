import { Breadcrumbs, PageHeader } from "../../_components/ui";
import { PageForm } from "../_components/PageForm";

export default function NewPagePage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Pages", href: "/admin/pages" }, { label: "New page" }]} />
      <PageHeader title="New page" />
      <PageForm page={null} />
    </div>
  );
}
