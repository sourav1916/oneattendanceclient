import MainLayout from "../layout/MainLayout";

const Dashboard = () => {
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">
        Welcome to OneAttendanceClient Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Total Clients</h2>
          <p className="text-3xl mt-4 text-blue-600">120</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Today's Attendance</h2>
          <p className="text-3xl mt-4 text-green-600">98</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Pending Reports</h2>
          <p className="text-3xl mt-4 text-red-600">5</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
