"use client";

import { motion } from "framer-motion";
import { Linkedin, Twitter, Mail, Users } from "lucide-react";

interface TeamMember {
  id:         string;
  name:       string;
  role:       string;
  bio:        string | null;
  image:      string | null;
  linkedin:   string | null;
  twitter:    string | null;
  email:      string | null;
  isFeatured: boolean;
}

const GRADS = [
  "from-blue-600 to-blue-400",
  "from-emerald-600 to-emerald-400",
  "from-purple-600 to-violet-400",
  "from-orange-500 to-amber-400",
  "from-pink-600 to-rose-400",
  "from-teal-600 to-cyan-400",
];

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  const grad = GRADS[member.name.charCodeAt(0) % GRADS.length];
  const initials = member.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group bg-background rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
    >
      {/* Photo / Avatar */}
      <div className="relative h-52 overflow-hidden bg-background-subtle">
        {member.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${grad}`}>
            <span className="text-white font-bold text-5xl">{initials}</span>
          </div>
        )}
        {member.isFeatured && (
          <div className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
            ⭐ Featured
          </div>
        )}
        {/* Overlay social links */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {member.linkedin && (
            <a href={member.linkedin} target="_blank" rel="noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors border border-white/20">
              <Linkedin size={16} />
            </a>
          )}
          {member.twitter && (
            <a href={member.twitter} target="_blank" rel="noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors border border-white/20">
              <Twitter size={16} />
            </a>
          )}
          {member.email && (
            <a href={`mailto:${member.email}`}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors border border-white/20">
              <Mail size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-semibold text-foreground">{member.name}</h3>
        <p className="text-sm text-primary font-medium mt-0.5">{member.role}</p>
        {member.bio && (
          <p className="text-xs text-foreground-muted mt-2 leading-relaxed line-clamp-3">{member.bio}</p>
        )}
      </div>
    </motion.div>
  );
}

export function TeamSection({ members }: { members: TeamMember[] }) {
  if (members.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="flex items-center justify-center gap-2 mx-auto mb-4 w-fit px-4 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary/10 border border-primary/20">
            <Users size={12} /> The Team
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            People Behind NexCart
          </h2>
          <p className="mt-3 text-foreground-muted max-w-xl mx-auto">
            A passionate team building the future of online shopping in Nepal.
          </p>
        </motion.div>

        {/* Grid */}
        <div className={`grid gap-6 ${
          members.length === 1 ? "grid-cols-1 max-w-xs mx-auto" :
          members.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" :
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        }`}>
          {members.map((m, i) => (
            <MemberCard key={m.id} member={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
