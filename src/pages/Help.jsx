import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaQuestionCircle,
  FaFileAlt,
  FaEnvelope,
  FaTwitter,
  FaDiscord,
  FaChevronDown,
  FaChevronUp,
  FaBook,
  FaRocket,
} from "react-icons/fa";

const HelpPage = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const faqs = [
    {
      id: 1,
      question: "How do I reset my password?",
      answer:
        "Navigate to the login page and click 'Forgot password'. You'll receive a reset link via email within a few minutes.",
    },
    {
      id: 2,
      question: "Can I change my subscription plan?",
      answer:
        "Yes! Go to Account Settings → Billing → Change Plan. You can upgrade or downgrade at any time. Changes take effect next billing cycle.",
    },
    {
      id: 3,
      question: "Is there a mobile app available?",
      answer:
        "Absolutely. Our mobile app is available on both iOS and Android. Download it from the App Store or Google Play Store.",
    },
    {
      id: 4,
      question: "How do I delete my account?",
      answer:
        "We're sorry to see you go. Please contact support via email with 'Account Deletion' in the subject line, and we'll assist you.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <FaRocket className="text-2xl text-indigo-600" />
            <h1 className="text-xl font-semibold text-slate-800">
              DummySupport
            </h1>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Search */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            How can we help you?
          </h2>
          <div className="max-w-xl mx-auto relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
            />
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          <div className="bg-white rounded-[10px] p-6 shadow-sm border border-slate-200 flex items-start gap-4 hover:shadow-md transition">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <FaFileAlt className="text-xl text-indigo-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Documentation</h3>
              <p className="text-sm text-slate-500 mt-1">
                Browse our guides and API references.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-[10px] p-6 shadow-sm border border-slate-200 flex items-start gap-4 hover:shadow-md transition">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <FaEnvelope className="text-xl text-indigo-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Contact Support</h3>
              <p className="text-sm text-slate-500 mt-1">
                We're here 24/7 to assist you.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-[10px] p-6 shadow-sm border border-slate-200 flex items-start gap-4 hover:shadow-md transition">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <FaBook className="text-xl text-indigo-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Knowledge Base</h3>
              <p className="text-sm text-slate-500 mt-1">
                In-depth tutorials and FAQs.
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white rounded-[10px] shadow-sm border border-slate-200 p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <FaQuestionCircle className="text-2xl text-indigo-600" />
            <h2 className="text-2xl font-semibold text-slate-800">
              Frequently Asked Questions
            </h2>
          </div>

          {filteredFaqs.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-500 py-8 text-center"
            >
              No matching questions found.
            </motion.p>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-medium text-slate-800">
                      {faq.question}
                    </span>
                    {openFaq === faq.id ? (
                      <FaChevronUp className="text-slate-500" />
                    ) : (
                      <FaChevronDown className="text-slate-500" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openFaq === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-white border-t border-slate-200 text-slate-600">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer / Social */}
        <motion.footer
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200"
        >
          <p className="text-sm text-slate-500">
            © 2025 DummySupport — just a dummy help page.
          </p>
          <div className="flex items-center gap-6">
            <FaTwitter className="text-lg text-slate-500 hover:text-indigo-600 cursor-pointer transition" />
            <FaDiscord className="text-lg text-slate-500 hover:text-indigo-600 cursor-pointer transition" />
            <FaEnvelope className="text-lg text-slate-500 hover:text-indigo-600 cursor-pointer transition" />
          </div>
        </motion.footer>
      </main>
    </div>
  );
};

export default HelpPage;