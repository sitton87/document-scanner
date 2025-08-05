import CameraCapture from "@/components/camera/CameraCapture";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Document Scanner
        </h1>
        <p className="text-lg text-gray-600">
          Scan and save your invoices automatically
        </p>
      </div>

      <div className="flex justify-center">
        <CameraCapture />
      </div>
    </main>
  );
}
