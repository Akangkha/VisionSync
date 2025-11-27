// src/components/WelcomeHero.jsx
import eyeballImg from "../../images/eyeBall.png";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
function FeatureItem({ title, description }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg  font-semibold text-slate-900">{title}</h3>
      <p className="text-sm  text-slate-600 leading-relaxed">{description}</p>
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Learn More
        <span aria-hidden>➝</span>
      </button>
    </div>
  );
}

export default function WelcomeHero() {
  return (
    <section className="w-full bg-white px-4 py-12 md:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10 md:mb-14">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-blue-500 mb-3">
            Digital Vision Therapy
          </p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.25 } },
            }}
          >
            <motion.h1
              variants={{
                hidden: { opacity: 0, rotateX: 90, y: 40 },
                visible: { opacity: 1, rotateX: 0, y: 0 },
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-3xl md:text-3xl lg:text-5xl font-bold text-slate-900 leading-tight"
            >
              Train Your Eyes
            </motion.h1>

            <motion.span
              variants={{
                hidden: { opacity: 0, rotateX: 90, y: 40 },
                visible: { opacity: 1, rotateX: 0, y: 0 },
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="block text-blue-600 text-3xl md:text-3xl lg:text-5xl font-bold leading-tight"
            >
              Through Play
            </motion.span>
          </motion.div>

          <p className="mt-4 text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
            A gaze-controlled maze game designed to support amblyopia and
            strabismus therapy by turning eye exercises into an engaging,
            trackable experience.
          </p>

          <div className="mt-6 flex justify-center">
            <Link
              to="/playground"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm md:text-base font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 transition"
            >
              Start Playground
              <span aria-hidden>🎮</span>
            </Link>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-3 items-center">
          <div className="order-2 lg:order-1 space-y-8">
            <FeatureItem
              title="Amblyopia Focus Training"
              description="Guide your gaze through the maze to keep the weaker eye engaged, improving fixation control and sustained visual attention."
            />
            <FeatureItem
              title="Strabismus Alignment Practice"
              description="Use gentle gaze-based movements to practice aligning both eyes on the same target, supporting binocular coordination."
            />
          </div>

          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative group">
              <img
                src={eyeballImg}
                alt="Close-up of an eye used for vision therapy"
                className="w-56 md:w-72 lg:w-80 max-w-full h-auto rounded-full object-cover shadow-xl 
                 transition-transform duration-500 ease-out group-hover:scale-110"
              />

              <span className="hidden md:block absolute -right-4 top-8 w-4 h-4 rounded-full bg-blue-200" />
            </div>
          </div>

          <div className="order-3 space-y-8">
            <FeatureItem
              title="Depth & Tracking Mazes"
              description="Red–cyan overlays and dynamic paths challenge depth perception, smooth pursuits, and saccadic movements in a playful way."
            />
            <FeatureItem
              title="Session Progress & Insights"
              description="Each session can log completion time, errors, and maze difficulty to help clinicians and families track visual progress over time."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
