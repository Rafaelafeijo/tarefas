import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-16 text-center">
      <p className="mb-1 text-lg font-semibold">We couldn&apos;t find this page or task.</p>
      <p className="mb-5 text-muted">It may have been deleted.</p>
      <Link href="/" className="btn btn-primary">
        Back to tasks
      </Link>
    </section>
  );
}
