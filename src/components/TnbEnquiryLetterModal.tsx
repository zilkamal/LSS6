import React, { useState } from 'react';
import { X, Download, Copy, FileText, Check, Mail, Building, User, Phone, MapPin, Zap, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';

interface TnbEnquiryLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  pmuName?: string;
  capacityMW?: number | string;
  pmuVoltage?: string;
  pmuState?: string;
}

export const TnbEnquiryLetterModal: React.FC<TnbEnquiryLetterModalProps> = ({
  isOpen,
  onClose,
  pmuName = 'PMU Bakri',
  capacityMW = '50 MW',
  pmuVoltage = '132kV',
  pmuState = 'Johor',
}) => {
  const [senderName, setSenderName] = useState('Ahmad Razali');
  const [senderTitle, setSenderTitle] = useState('Head of Renewable Energy & Business Development');
  const [companyName, setCompanyName] = useState('Tenaga Hijau SPV 1 Sdn Bhd');
  const [contactInfo, setContactInfo] = useState('razali@tenagahijau.com | +6012-345 6789');
  const [targetOfficer, setTargetOfficer] = useState('Tenaga Nasional Berhad (TNB) / Relevant Grid Division Officer');
  const [customPmuName, setCustomPmuName] = useState(`PMU ${pmuName} (${pmuVoltage})`);
  const [customCapacity, setCustomCapacity] = useState(`${capacityMW}`);
  const [letterDate, setLetterDate] = useState('30 July 2026');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullLetterText = `Subject: Enquiry on Interconnection Point Availability and Remaining Headroom for LSS6-Hybrid Project – ${customPmuName}

To: ${targetOfficer}

Date: ${letterDate}

Dear Sir/Madam,

RE: VERIFICATION OF INTERCONNECTION POINT AVAILABILITY FOR LSS6-HYBRID PROJECT

We are currently preparing our bid submission for the Request for Proposal: Hybrid of Large Scale Solar (LSS) and Battery Energy Storage System (BESS) (LSS6 – Hybrid), issued by Suruhanjaya Tenaga on 27 July 2026.

As part of our project development and site investigation, we are evaluating ${customPmuName} as our intended Interconnection Point. The RFP document lists the indicative Potential Export Capacity for this nodal point as ${customCapacity}.

In accordance with the RFP guidelines, which state that bidders must directly verify and confirm the latest status of the Interconnection Points with the Grid Owner, we would like to respectfully request the following information:

1. Current Availability: Can you confirm the real-time remaining headroom (MWa.c.) available at ${customPmuName} for our intended connection? 
2. System Requirements: Are there any currently known requirements for technically justifiable upgrading or modifications to this existing PMU to support our interconnection?
3. Next Steps: Could you please advise on the procedure and necessary documentation required from our end to initiate the formal power system studies/connection checks and to obtain your official approval for this specific node?

We look forward to your guidance so we can ensure our proposed Hybrid Plant's design and interconnection arrangements fully comply with TNB's specifications and system security requirements.

Thank you for your time and assistance.

Sincerely,

${senderName}
${senderTitle}
${companyName}
${contactInfo}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadDoc = () => {
    const element = document.createElement('a');
    const file = new Blob([fullLetterText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `TNB_Headroom_Enquiry_Letter_${pmuName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 18;

    // Header / Letterhead
    doc.setFillColor(15, 23, 42); // Dark slate banner
    doc.rect(0, 0, pageWidth, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(245, 158, 11); // Amber
    doc.text('LSS6-HYBRID BID SUBMISSION SUPPORT TOOL', 14, 10);

    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);
    doc.text('FORMAL GRID OWNER INTERCONNECTION HEADROOM VERIFICATION LETTER', 14, 15);

    doc.setTextColor(148, 163, 184);
    doc.text(`DATE: ${letterDate}`, pageWidth - 14, 15, { align: 'right' });

    y = 30;

    // Recipient block
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('TO:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(targetOfficer, 24, y);

    y += 8;

    // Subject Box
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, pageWidth - 28, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SUBJECT:', 18, y + 6);
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9); // Amber-800
    const subjLines = doc.splitTextToSize(`Enquiry on Interconnection Point Availability and Remaining Headroom for LSS6-Hybrid Project – ${customPmuName}`, pageWidth - 55);
    doc.text(subjLines, 36, y + 6);

    y += 20;

    // Salutation
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Dear Sir/Madam,', 14, y);

    y += 6;

    // Title RE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('RE: VERIFICATION OF INTERCONNECTION POINT AVAILABILITY FOR LSS6-HYBRID PROJECT', 14, y);

    y += 8;

    // Body Paragraph 1
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    const body1 = `We are currently preparing our bid submission for the Request for Proposal: Hybrid of Large Scale Solar (LSS) and Battery Energy Storage System (BESS) (LSS6 – Hybrid), issued by Suruhanjaya Tenaga on 27 July 2026.`;
    const lines1 = doc.splitTextToSize(body1, pageWidth - 28);
    doc.text(lines1, 14, y);
    y += lines1.length * 4.5 + 3;

    // Body Paragraph 2
    const body2 = `As part of our project development and site investigation, we are evaluating ${customPmuName} as our intended Interconnection Point. The RFP document lists the indicative Potential Export Capacity for this nodal point as ${customCapacity}.`;
    const lines2 = doc.splitTextToSize(body2, pageWidth - 28);
    doc.text(lines2, 14, y);
    y += lines2.length * 4.5 + 3;

    // Body Paragraph 3
    const body3 = `In accordance with the RFP guidelines, which state that bidders must directly verify and confirm the latest status of the Interconnection Points with the Grid Owner, we would like to respectfully request the following information:`;
    const lines3 = doc.splitTextToSize(body3, pageWidth - 28);
    doc.text(lines3, 14, y);
    y += lines3.length * 4.5 + 4;

    // Numbered List Items
    const items = [
      {
        num: '1. Current Availability:',
        text: `Can you confirm the real-time remaining headroom (MWa.c.) available at ${customPmuName} for our intended connection?`,
      },
      {
        num: '2. System Requirements:',
        text: `Are there any currently known requirements for technically justifiable upgrading or modifications to this existing PMU to support our interconnection?`,
      },
      {
        num: '3. Next Steps:',
        text: `Could you please advise on the procedure and necessary documentation required from our end to initiate the formal power system studies/connection checks and to obtain your official approval for this specific node?`,
      },
    ];

    items.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(item.num, 18, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const itemLines = doc.splitTextToSize(item.text, pageWidth - 65);
      doc.text(itemLines, 54, y);

      y += Math.max(itemLines.length * 4.5, 6) + 3;
    });

    y += 2;

    // Paragraph 4
    const body4 = `We look forward to your guidance so we can ensure our proposed Hybrid Plant's design and interconnection arrangements fully comply with TNB's specifications and system security requirements.`;
    const lines4 = doc.splitTextToSize(body4, pageWidth - 28);
    doc.text(lines4, 14, y);
    y += lines4.length * 4.5 + 3;

    // Paragraph 5
    doc.text('Thank you for your time and assistance.', 14, y);
    y += 10;

    // Sign off
    doc.text('Sincerely,', 14, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(senderName, 14, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(senderTitle, 14, y);
    y += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(companyName, 14, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(contactInfo, 14, y);

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 280, pageWidth - 14, 280);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated by LSS6-Hybrid Feasibility Intelligence Platform | Official RFP Grid Enquiry Draft', 14, 284);
    doc.text('Page 1 of 1', pageWidth - 14, 284, { align: 'right' });

    doc.save(`TNB_Interconnection_Enquiry_Letter_${pmuName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-300 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 text-slate-950 font-black rounded flex items-center justify-center text-lg">
              <Mail className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-mono">
                  LSS6-Hybrid Grid Enquiry Tool
                </span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded">
                  Official RFP Annex
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                TNB Grid Interconnection Headroom Verification Draft Letter
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold px-3 py-1.5 rounded text-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Text'}
            </button>
            <button
              onClick={handleDownloadDoc}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold px-3 py-1.5 rounded text-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              Download .TXT
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded text-xs transition-colors shadow cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Official PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left panel = Edit Parameters, Right panel = Live Document Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden flex-1">
          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto space-y-4 text-xs font-sans">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Custom Letter Parameters</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Fill in your company & project details. The letter text & PDF download update live in real-time.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Your Full Name & Title
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:border-amber-500 outline-none"
                  placeholder="e.g. Ahmad Razali"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Title / Position</label>
                <input
                  type="text"
                  value={senderTitle}
                  onChange={(e) => setSenderTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-amber-500 outline-none"
                  placeholder="e.g. Head of Business Development"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-500" /> Bidding SPV / Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:border-amber-500 outline-none"
                  placeholder="e.g. Tenaga Hijau SPV 1 Sdn Bhd"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> Contact Info (Email & Phone)
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-amber-500 outline-none"
                  placeholder="e.g. email@company.com | +6012-345 6789"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> Target Interconnection PMU Node
                </label>
                <input
                  type="text"
                  value={customPmuName}
                  onChange={(e) => setCustomPmuName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-amber-900 font-bold font-mono focus:border-amber-500 outline-none"
                  placeholder="e.g. PMU Bakri (132kV)"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Indicative Export Capacity</label>
                <input
                  type="text"
                  value={customCapacity}
                  onChange={(e) => setCustomCapacity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:border-amber-500 outline-none"
                  placeholder="e.g. 50 MW / 100 MW / 250 MW"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Letter Date
                </label>
                <input
                  type="text"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Target TNB Officer / Division</label>
                <input
                  type="text"
                  value={targetOfficer}
                  onChange={(e) => setTargetOfficer(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Letter Document Preview Area */}
          <div className="lg:col-span-8 bg-slate-200 p-6 overflow-y-auto flex justify-center">
            <div className="bg-white border border-slate-300 shadow-xl rounded max-w-2xl w-full p-8 font-sans text-slate-800 space-y-4 text-xs leading-relaxed">
              {/* Header Letterhead line */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
                <div>
                  <h1 className="text-sm font-black text-slate-900 tracking-wide uppercase">
                    {companyName || '[Your Company Name]'}
                  </h1>
                  <p className="text-[11px] text-slate-500">{senderTitle || '[Your Title]'}</p>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono">
                  Date: <span className="font-bold text-slate-800">{letterDate}</span>
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block">TO:</span>
                <p className="text-slate-800 font-medium">{targetOfficer}</p>
              </div>

              {/* Subject line box */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r text-slate-900 font-bold">
                <span className="text-amber-800 text-[10px] uppercase block tracking-wider font-mono">SUBJECT:</span>
                Enquiry on Interconnection Point Availability and Remaining Headroom for LSS6-Hybrid Project –{' '}
                <span className="text-amber-900 font-black">{customPmuName || '[Insert PMU Name]'}</span>
              </div>

              <p className="font-bold text-slate-900">Dear Sir/Madam,</p>

              <p className="font-bold text-slate-900 underline">
                RE: VERIFICATION OF INTERCONNECTION POINT AVAILABILITY FOR LSS6-HYBRID PROJECT
              </p>

              <p>
                We are currently preparing our bid submission for the{' '}
                <strong>Request for Proposal: Hybrid of Large Scale Solar (LSS) and Battery Energy Storage System (BESS) (LSS6 – Hybrid)</strong>, issued by Suruhanjaya Tenaga on 27 July 2026.
              </p>

              <p>
                As part of our project development and site investigation, we are evaluating{' '}
                <strong className="text-amber-800">{customPmuName || '[Insert PMU Name]'}</strong> as our intended Interconnection Point. The RFP document lists the indicative Potential Export Capacity for this nodal point as{' '}
                <strong className="text-amber-800">{customCapacity || '[Insert Capacity]'}</strong>.
              </p>

              <p>
                In accordance with the RFP guidelines, which state that bidders must directly verify and confirm the latest status of the Interconnection Points with the Grid Owner, we would like to respectfully request the following information:
              </p>

              <ol className="list-none space-y-2 pl-2">
                <li className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-bold text-slate-900 shrink-0">1. Current Availability:</span>
                  <span>Can you confirm the real-time remaining headroom (MWa.c.) available at <strong>{customPmuName}</strong> for our intended connection?</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-bold text-slate-900 shrink-0">2. System Requirements:</span>
                  <span>Are there any currently known requirements for technically justifiable upgrading or modifications to this existing PMU to support our interconnection?</span>
                </li>
                <li className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-bold text-slate-900 shrink-0">3. Next Steps:</span>
                  <span>Could you please advise on the procedure and necessary documentation required from our end to initiate the formal power system studies/connection checks and to obtain your official approval for this specific node?</span>
                </li>
              </ol>

              <p>
                We look forward to your guidance so we can ensure our proposed Hybrid Plant's design and interconnection arrangements fully comply with TNB's specifications and system security requirements.
              </p>

              <p>Thank you for your time and assistance.</p>

              <div className="pt-4 space-y-1 border-t border-slate-200">
                <p>Sincerely,</p>
                <p className="font-bold text-slate-900 text-sm mt-3">{senderName || '[Your Name]'}</p>
                <p className="text-slate-600 font-medium">{senderTitle || '[Your Title]'}</p>
                <p className="text-amber-800 font-bold">{companyName || '[Your Company Name]'}</p>
                <p className="text-slate-500 font-mono text-[11px]">{contactInfo || '[Your Contact Information]'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
