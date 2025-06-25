import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { ArrowUpRight, CheckCircle2, Shield, Users, Zap } from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need for Perfect Scheduling
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              ClassAlign combines intuitive design with powerful AI to make
              class scheduling effortless and conflict-free.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <ArrowUpRight className="w-6 h-6" />,
                title: "Weekly Calendar View",
                description:
                  "Interactive grid with color-coded classes and hover details",
              },
              {
                icon: <CheckCircle2 className="w-6 h-6" />,
                title: "Conflict Detection",
                description: "Built-in validation prevents scheduling overlaps",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "AI Schedule Assistant",
                description: "Smart suggestions for optimal class timing",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Secure & Personal",
                description: "Your schedule data is private and protected",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How ClassAlign Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get organized in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Your Classes</h3>
              <p className="text-gray-600">
                Enter your subjects, times, and room locations with our simple
                form
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get AI Suggestions</h3>
              <p className="text-gray-600">
                Our AI analyzes your schedule and suggests optimal arrangements
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Stay Organized</h3>
              <p className="text-gray-600">
                View your weekly calendar and never miss a class again
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Organize Your Classes?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join students who have transformed their academic organization with
            ClassAlign's smart scheduling.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Start Scheduling Free
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
