import { create } from "zustand"
import { supabase, getUserCompany } from "../lib/supabase"

export const useDispatchStore = create((set, get) => ({

  drivers: [],
  jobs: [],
  alerts: [],
  aiSuggestions: [],
  selectedJob: null,
  selectedDriver: null,

  setDrivers: (drivers) => set({ drivers }),
  setJobs: (jobs) => set({ jobs }),
  setAlerts: (alerts) => set({ alerts }),
  setAISuggestions: (aiSuggestions) => set({ aiSuggestions }),

  selectJob: (job) => set({ selectedJob: job }),
  selectDriver: (driver) => set({ selectedDriver: driver }),

  // LOAD DRIVERS FROM DATABASE
  loadDrivers: async () => {

    const companyId = await getUserCompany()

    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("company_id", companyId)

    if (!error) {
      set({ drivers: data })
    }

  },

  // LOAD JOBS FROM DATABASE
  loadJobs: async () => {

    const companyId = await getUserCompany()

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", companyId)

    if (!error) {
      set({ jobs: data })
    }

  },

  // ASSIGN DRIVER TO JOB
  assignDriverToJob: async (driverId, jobId) => {

    const { error } = await supabase
      .from("jobs")
      .update({
        driver_id: driverId,
        status: "assigned"
      })
      .eq("id", jobId)

    if (!error) {

      const { jobs } = get()

      const updatedJobs = jobs.map(job =>
        job.id === jobId
          ? { ...job, driver_id: driverId, status: "assigned" }
          : job
      )

      set({ jobs: updatedJobs })

    }

  }

}))
