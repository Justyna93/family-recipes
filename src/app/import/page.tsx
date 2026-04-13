import ImportForm from "@/components/ImportForm";

export default function ImportPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Import Recipe</h1>
      <ImportForm />
    </main>
  );
}
