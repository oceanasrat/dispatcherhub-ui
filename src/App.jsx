import { useEffect, useState } from "react"
import { supabase, getUserCompany } from "./lib/supabase.js"
import { useDispatchStore } from "./store/useDispatchStore.js"

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

  useEffect(()=>{
    loadDrivers()
    loadJobs()
  },[])

  async function loadDrivers(){

    const companyId = await getUserCompany()

    const { data } = await supabase
      .from("drivers")
      .select("*")
      .eq("company_id",companyId)

    if(data) setDrivers(data)
  }

  async function loadJobs(){

    const companyId = await getUserCompany()

    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id",companyId)

    if(data) setJobs(data)
  }

  async function createJob(){

    const companyId = await getUserCompany()

    const { data } = await supabase
      .from("jobs")
      .insert({
        title,
        origin,
        destination,
        revenue,
        company_id: companyId,
        status: "pending"
      })
      .select()

    if(data){
      setJobs([...jobs,...data])

      setTitle("")
      setOrigin("")
      setDestination("")
      setRevenue("")
    }
  }

  return (

    <div style={{ padding:40 }}>

      <h1>Universal Dispatch Control</h1>

      <h2>Create Job</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
      />

      <br/>

      <input
        placeholder="Origin"
        value={origin}
        onChange={(e)=>setOrigin(e.target.value)}
      />

      <br/>

      <input
        placeholder="Destination"
        value={destination}
        onChange={(e)=>setDestination(e.target.value)}
      />

      <br/>

      <input
        placeholder="Revenue"
        value={revenue}
        onChange={(e)=>setRevenue(e.target.value)}
      />

      <br/>

      <button onClick={createJob}>
        Create Job
      </button>

      <h2 style={{ marginTop:40 }}>Active Jobs</h2>

      {jobs.map(job => (

        <div
          key={job.id}
          style={{
            border:"1px solid #ddd",
            padding:10,
            marginBottom:10
          }}
        >

          <b>{job.title}</b>

          <p>
            {job.origin} → {job.destination}
          </p>

          <p>Status: {job.status}</p>

          <select
            onChange={(e)=>assignDriverToJob(e.target.value,job.id)}
          >

            <option>Assign Driver</option>

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
  )
}
