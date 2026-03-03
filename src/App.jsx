import { useDispatchStore } from "./store/useDispatchStore"

export default function App() {
  const jobs = useDispatchStore(state => state.jobs)
  const setJobs = useDispatchStore(state => state.setJobs)

  return (
    <div style={{ padding: 40 }}>
      <h1>Dispatch Store Test</h1>

      <button
        onClick={() =>
          setJobs([{ id: 1, name: "Test Job", status: "pending" }])
        }
      >
        Add Test Job
      </button>

      <pre>{JSON.stringify(jobs, null, 2)}</pre>
    </div>
  )
}
