import { getEstimateLeads } from "@/lib/estimator/lead-actions";
import { MarkCompleteButton } from "@/components/admin/mark-complete-button";
import { DeleteEstimateButton } from "@/components/admin/delete-estimate-button";
import { GetInvoiceButton } from "@/components/admin/get-invoice-button";
import { EstimateDetail } from "@/components/admin/estimate-detail";

export const dynamic = "force-dynamic";

function extractEstimatedDate(estimateData: string): string | null {
  try {
    const parsed = JSON.parse(estimateData);
    if (parsed?.state?.estimatedDate) {
      return new Date(parsed.state.estimatedDate + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
    }
    return null;
  } catch {
    return null;
  }
}

export default async function AdminEstimatesPage() {
  const leads = await getEstimateLeads();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Estimates</h1>
        <span className="text-sm text-muted-foreground">{leads.length} total</span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[800px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Client</th>
              <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Phone</th>
              <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Event</th>
              <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Event Date</th>
              <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Estimate</th>
              <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Created</th>
              <th className="whitespace-nowrap p-3 text-left text-sm font-medium">Status</th>
              <th className="whitespace-nowrap p-3 text-left text-sm font-medium" />
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No estimates yet. Clients will appear here when they use the estimator.
                </td>
              </tr>
            )}
            {leads.map((lead) => {
              const eventDate = extractEstimatedDate(lead.estimateData);
              return (
                <tr key={lead.id} className="border-t">
                  <td className="p-3 font-medium text-sm">{lead.clientName}</td>
                  <td className="p-3 text-sm">{lead.clientPhone}</td>
                  <td className="p-3 text-sm">{lead.eventName || lead.eventType}</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {eventDate || "\u2014"}
                  </td>
                  <td className="p-3 text-sm">
                    <EstimateDetail estimateData={lead.estimateData} />
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="p-3 text-sm">
                    <span className={lead.status === "completed" ? "text-green-600 font-medium" : "text-muted-foreground"}>
                      {lead.status === "completed" ? "Completed" : "Pending"}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <GetInvoiceButton
                        lead={{
                          id: lead.id,
                          clientName: lead.clientName,
                          clientPhone: lead.clientPhone,
                          eventName: lead.eventName,
                          eventType: lead.eventType,
                          estimateData: lead.estimateData,
                        }}
                      />
                      <MarkCompleteButton id={lead.id} currentStatus={lead.status} />
                      <DeleteEstimateButton id={lead.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
