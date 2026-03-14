import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, ArrowRight } from "lucide-react";
import { useState } from "react";

const freeFeatures = [
  "5 analyses per month",
  "All 4 AI agents",
  "Security vulnerability scanner",
  "Documentation generator",
  "Architecture review",
  "Download markdown reports",
  "Bring your own LLM (Ollama)",
];

const proFeatures = [
  "Everything in Free",
  "Unlimited analyses",
  { text: "Auto-Fix Agent", highlight: true },
  "GitHub PR creation",
  "50 files per analysis",
  "Unlimited history",
  "OpenAI / Anthropic support",
  "Priority support",
];

function Pricing() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleUpgradeClick = () => {
    setShowComingSoon(true);
  };

  return (
    <section className="py-24 px-4 bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-purple-400 text-sm font-medium tracking-widest uppercase">
            Pricing
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">
            Simple Pricing
          </h2>
          <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">
            Start free. Upgrade when you need more power.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan Card */}
          <motion.div
            className="bg-gray-900 border border-white/10 rounded-2xl p-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -4 }}
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white">Free</h3>
              <div className="mt-4">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-gray-400 ml-2">/ month</span>
              </div>
              <p className="text-gray-500 mt-2">Perfect for exploring</p>
            </div>

            <ul className="space-y-4 mb-8">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-gray-400" />
                  </div>
                  <span className="text-gray-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Link to="/register">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* Pro Plan Card */}
          <motion.div
            className="relative bg-gradient-to-b from-purple-950/50 to-gray-900 border-2 border-purple-500 rounded-2xl p-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Most Popular Badge */}
            <Badge className="absolute -top-3 right-6 bg-purple-600 text-white px-3 py-1">
              Most Popular
            </Badge>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                Pro
                <Zap className="w-5 h-5 text-purple-400" />
              </h3>
              <div className="mt-4">
                <span className="text-5xl font-bold text-white">$29</span>
                <span className="text-gray-400 ml-2">/ month</span>
              </div>
              <p className="text-gray-500 mt-2">For serious developers</p>
            </div>

            <ul className="space-y-4 mb-8">
              {proFeatures.map((feature, index) => {
                const isHighlight = typeof feature === "object";
                const text = isHighlight ? feature.text : feature;
                return (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-purple-400" />
                    </div>
                    <span
                      className={`text-sm ${isHighlight ? "text-purple-400 font-medium" : "text-gray-300"}`}
                    >
                      {text}
                      {isHighlight && " ✨"}
                    </span>
                  </li>
                );
              })}
            </ul>

            <Button
              onClick={handleUpgradeClick}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>

            {/* Coming Soon Message */}
            {showComingSoon && (
              <motion.div
                className="bg-purple-950 border border-purple-500 rounded-xl p-4 text-center text-purple-200 text-sm mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                🚀 Payment processing coming soon! This is a hackathon demo.
                Contact us at agentlens@demo.com to get Pro access.
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Money Back Guarantee */}
        <motion.p
          className="text-center text-gray-500 text-sm mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          💳 30-day money-back guarantee · Cancel anytime · No questions asked
        </motion.p>
      </div>
    </section>
  );
}

export default Pricing;
