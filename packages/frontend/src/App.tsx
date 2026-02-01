function App() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tailwind v4 Test
        </h1>
        <p className="text-gray-600 mb-4">
          If you see this blue background and white card, Tailwind v4 is working! 🎉
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            Primary
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition">
            Secondary
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;