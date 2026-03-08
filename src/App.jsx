import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import { useDispatchStore } from "./store/useDispatchStore"

export default function App() {

  const jobs = useDispatchStore(state => state.jobs)
  const drivers = useDispatchStore(state => state.drivers)

  const setJobs = useDispatchStore(state => state.setJobs)
  const setDrivers = useDispatchStore(state => state.setDrivers)
  const assignDriverToJob = useDispatchStore(state => state.assignDriverToJob)

  const [title,setTitle] = useState("")
  const [origin,setOrigin] = useState("")
  const [destination,setDestination] = useState("")
  const [revenue,setRevenue] = useState("")

  useEffect(() => {
    loadDrivers()
    loadJobs()
  }, [])

  async function loadDrivers(){

    const { data } = await supabase
      .from("drivers")
      .select("*")

    if(data) setDrivers(data)

  }

  async function loadJobs(){

    const { data } = await supabase
      .from("jobs")
      .select("*")

    if(data) setJobs(data)

  }

  async function createJob(){

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title,
        origin,
        destination,
        revenue,
        status: "pending"
      })
      .select()

    if(error){
      console.log(error)
      alert("Error creating job")
      return
    }

    if(data){

      setJobs([...jobs,...data])

      setTitle("")
      setOrigin("")
      setDestination("")
      setRevenue("")

    }

  }

  return (

    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Universal Dispatch Control
        </h1>

        <div className="bg-white p-6 rounded-lg shadow mb-8">

          <h2 className="text-xl font-semibold mb-4">
            Create Job
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <input
              className="border p-3 rounded"
              placeholder="Title"
              value={title}
              onChange={(e)=>setTitle(e.target.value)}
            />

            <input
              className="border p-3 rounded"
              placeholder="Revenue"
              value={revenue}
              onChange={(e)=>setRevenue(e.target.value)}
            />

            <input
              className="border p-3 rounded"
              placeholder="Origin"
              value={origin}
              onChange={(e)=>setOrigin(e.target.value)}
            />

            <input
              className="border p-3 rounded"
              placeholder="Destination"
              value={destination}
              onChange={(e)=>setDestination(e.target.value)}
            />

          </div>

          <button
            className="mt-4 bg-blue-600 text-white px-5 py-3 rounded hover:bg-blue-700"
            onClick={createJob}
          >
            Create Job
          </button>

        </div>


        <div className="bg-white p-6 rounded-lg shadow">

          <h2 className="text-xl font-semibold mb-4">
            Active Jobs
          </h2>

          {jobs.map(job => (

            <div
              key={job.id}
              className="border rounded p-4 mb-3 flex justify-between items-center"
            >

              <div>

                <b className="text-lg">
                  {job.title}
                </b>

                <p className="text-gray-600">
                  {job.origin} → {job.destination}
                </p>

                <p className="text-sm">
                  Status: {job.status}
                </p>

              </div>

              <select
                className="border p-2 rounded"
                onChange={(e)=>assignDriverToJob(e.target.value,job.id)}
              >

                <option>
                  Assign Driver
                </option>

                {drivers.map(driver => (

                  <option
                    key={driver.id}
                    value={driver.id}
                  >
                    {driver.name}
                  </option>

                ))}

              </select>

            </div>

          ))}

        </div>

      </div>

    </div>

  )

}
