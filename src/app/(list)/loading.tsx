// In the (list) route group so it only covers the list. At the root it would also
// wrap the edit page, and streaming it would turn missing-task 404s into 200s.
export default function Loading() {
  return (
    <div role="status" aria-label="Loading tasks" className="animate-pulse">
      <div className="mb-7 h-8 w-40 rounded-md bg-border" />
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-border px-2 py-3.5">
          <div className="size-3 rounded-full bg-border" />
          <div className="h-3.5 w-1/2 rounded bg-border" />
        </div>
      ))}
    </div>
  );
}
