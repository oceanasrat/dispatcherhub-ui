import { create } from "zustand"
import { supabase } from "../lib/supabase.js"

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
