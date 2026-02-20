import { supabase } from "./supabase";

export type JobSite = {
  id: string;
  label: string;
  url: string;
  position: number;
};

type JobSiteRow = {
  id: string;
  label: string;
  url: string;
  position: number;
};

function rowToJobSite(row: JobSiteRow): JobSite {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    position: row.position,
  };
}

export async function fetchJobSites(): Promise<JobSite[]> {
  const { data, error } = await supabase
    .from("job_sites")
    .select("*")
    .order("position", { ascending: true });

  if (error) throw error;
  return (data as JobSiteRow[]).map(rowToJobSite);
}

export async function insertJobSite(data: {
  label: string;
  url: string;
  position?: number;
}): Promise<JobSite> {
  const maxPosition = await getMaxPosition();
  const row = {
    label: data.label.trim(),
    url: data.url.trim(),
    position: data.position ?? maxPosition + 1,
  };

  const { data: inserted, error } = await supabase
    .from("job_sites")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToJobSite(inserted as JobSiteRow);
}

async function getMaxPosition(): Promise<number> {
  const { data } = await supabase
    .from("job_sites")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { position: number } | null)?.position ?? -1;
}

export async function updateJobSite(
  id: string,
  data: { label?: string; url?: string; position?: number }
): Promise<JobSite> {
  const updates: Partial<JobSiteRow> = {};
  if (data.label !== undefined) updates.label = data.label.trim();
  if (data.url !== undefined) updates.url = data.url.trim();
  if (data.position !== undefined) updates.position = data.position;
  if (Object.keys(updates).length === 0) {
    const { data: current } = await supabase
      .from("job_sites")
      .select("*")
      .eq("id", id)
      .single();
    if (current) return rowToJobSite(current as JobSiteRow);
    throw new Error("Site non trouvé");
  }

  const { data: updated, error } = await supabase
    .from("job_sites")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return rowToJobSite(updated as JobSiteRow);
}

export async function deleteJobSite(id: string): Promise<void> {
  const { error } = await supabase.from("job_sites").delete().eq("id", id);
  if (error) throw error;
}

// --- Statut utilisateur par site (compte créé, CV envoyé) ---

export type UserJobSiteStatus = {
  jobSiteId: string;
  accountCreated: boolean;
  cvSent: boolean;
};

export async function fetchUserJobSiteStatus(
  userId: string
): Promise<UserJobSiteStatus[]> {
  const { data, error } = await supabase
    .from("user_job_site_status")
    .select("job_site_id, account_created, cv_sent")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row: { job_site_id: string; account_created: boolean; cv_sent: boolean }) => ({
    jobSiteId: row.job_site_id,
    accountCreated: row.account_created,
    cvSent: row.cv_sent,
  }));
}

export async function upsertUserJobSiteStatus(
  userId: string,
  jobSiteId: string,
  data: { accountCreated: boolean; cvSent: boolean }
): Promise<void> {
  const { error } = await supabase.from("user_job_site_status").upsert(
    {
      user_id: userId,
      job_site_id: jobSiteId,
      account_created: data.accountCreated,
      cv_sent: data.cvSent,
    },
    {
      onConflict: "user_id,job_site_id",
      ignoreDuplicates: false,
    }
  );

  if (error) throw error;
}
