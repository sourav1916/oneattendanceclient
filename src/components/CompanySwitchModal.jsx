function CompanySwitchModal({ open, setOpen }) {

  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  const fetchCompanies = async () => {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE}/company/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (result.success) {
        setCompanies(result.data);
      }

    } catch (error) {
      console.error(error);
    }

  };

  const handleSelectCompany = (company) => {

    localStorage.setItem("company", JSON.stringify(company));

    setOpen(false);

    window.location.reload();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >

          <motion.div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >

            <h2 className="text-xl font-bold mb-4">
              Select Company
            </h2>

            <div className="space-y-3">

              {companies.map((company) => (

                <div
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >

                  <div className="font-semibold">
                    {company.name}
                  </div>

                  <div className="text-sm text-gray-500">
                    {company.city}, {company.state}
                  </div>

                </div>

              ))}

            </div>

          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
