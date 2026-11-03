import Link from "next/link";

export default function NotFound() {
  return (
    <section className="card p-[30px] text-center">
      <p className="mb-[15px]">We couldn&apos;t find this page or task.</p>
      <Link href="/" className="text-blue underline">
        Back to tasks
      </Link>
    </section>
  );
}
