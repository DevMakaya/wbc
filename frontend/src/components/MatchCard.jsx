import { Link } from "react-router-dom";
import ScoreBadge from "./ScoreBadge";
import { Building2, User, MapPin, Globe } from "lucide-react";

export function LenderMatchCard({ match }) {
  const { lender, score, breakdown } = match;
  return (
    <Link
      to={`/lenders/${lender.id}`}
      className="block bg-navy-900 border border-navy-800 rounded-xl p-5 hover:border-gold-600/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold">{lender.lender_name}</h3>
          <p className="text-navy-400 text-sm">{lender.lender_type}</p>
        </div>
        <ScoreBadge score={score} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-navy-300">
          <MapPin size={14} className="text-navy-500" />
          {lender.based_in || "N/A"}
        </div>
        <div className="flex items-center gap-1.5 text-navy-300">
          <Globe size={14} className="text-navy-500" />
          {lender.geographic_coverage || "N/A"}
        </div>
        <div className="flex items-center gap-1.5 text-navy-300">
          <User size={14} className="text-navy-500" />
          {lender.contact_name}
        </div>
        <div className="flex items-center gap-1.5 text-navy-300">
          <Building2 size={14} className="text-navy-500" />
          {lender.lender_location || "N/A"}
        </div>
      </div>
      <div className="mt-3 flex gap-3 text-xs text-navy-500">
        <span>Geo: {breakdown.geo}</span>
        <span>Breadth: {breakdown.breadth}</span>
        <span>Structure: {breakdown.structure}</span>
      </div>
    </Link>
  );
}

export function ProspectMatchCard({ match }) {
  const { prospect, score, matchedProduct } = match;
  return (
    <Link
      to={`/pipeline/${prospect.id}`}
      className="block bg-navy-900 border border-navy-800 rounded-xl p-5 hover:border-gold-600/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold">{prospect.client_name}</h3>
          <p className="text-navy-400 text-sm">{prospect.company_name}</p>
        </div>
        <ScoreBadge score={score} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-navy-300">
          <span className="text-navy-500">Product: </span>
          {matchedProduct}
        </div>
        <div className="text-navy-300">
          <span className="text-navy-500">Stage: </span>
          {prospect.deal_stage || "N/A"}
        </div>
        <div className="text-navy-300">
          <span className="text-navy-500">Size: </span>
          {prospect.deal_size ? `$${Number(prospect.deal_size).toLocaleString()}` : "N/A"}
        </div>
        <div className="text-navy-300">
          <span className="text-navy-500">Location: </span>
          {prospect.physical_location || "N/A"}
        </div>
      </div>
    </Link>
  );
}
