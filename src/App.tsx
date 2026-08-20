import React, { useState, useEffect } from 'react';
import { PMUNode, LandParcel, StateName, RFPPackageProgram } from './types';
import { PMU_NODES } from './data/pmuNodes';
import { PMU_NODES_PACKAGE_3 } from './data/package3PmuNodes';
import { Navbar } from './components/Navbar';
import { InteractiveMap } from './components/InteractiveMap';
import { PMUNodeDetails } from './components/PMUNodeDetails';
import { CustomLandCalculator } from './components/CustomLandCalculator';
import { NodeComparer } from './components/NodeComparer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PMUCapacityTable } from './components/PMUCapacityTable';
import { LandFeasibilityModal } from './components/LandFeasibilityModal';
import { SystemArchitectureModal } from './components/SystemArchitectureModal';
import { ProposedLandsSection } from './components/ProposedLandsSection';
import { TnbEnquiryLetterModal } from './components/TnbEnquiryLetterModal';
import { UserManualModal } from './components/UserManualModal';
import { OpenDataIntegrationModal } from './components/OpenDataIntegrationModal';
import { PackageLandingModal } from './components/PackageLandingModal';
import { downloadPlatformReadme, exportPlatformReadmePdf } from './utils/readmeDownloader';
import { Zap, MapPin, Search, CheckCircle2, ShieldAlert, ArrowUpRight, Compass } from 'lucide-react';

export default function App() {
  const [selectedPackage, setSelectedPackage] = useState<RFPPackageProgram>('hybrid');
  const [isPackageSelectorOpen, setIsPackageSelectorOpen] = useState<boolean>(false);

  const [nodes, setNodes] = useState<PMUNode[]>(PMU_NODES);
  const [activeTab, setActiveTab] = useState<'map' | 'proposed' | 'custom' | 'analytics' | 'compare' | 'capacity'>('map');

  // Filter States
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedVoltage, setSelectedVoltage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minCapacity, setMinCapacity] = useState<number>(0);

  // Selected Nodes & Parcels
  const [selectedNode, setSelectedNode] = useState<PMUNode | null>(PMU_NODES[0]);
  const [selectedLandParcel, setSelectedLandParcel] = useState<LandParcel | null>(PMU_NODES[0].landParcels[0] || null);

  // Switch dataset when package changes
  const handlePackageChange = (pkg: RFPPackageProgram) => {
    setSelectedPackage(pkg);
    const targetNodes = pkg === 'package3' ? PMU_NODES_PACKAGE_3 : PMU_NODES;
    setNodes(targetNodes);
    setSelectedState('All');
    setSelectedVoltage('All');
    setMinCapacity(0);
    setSearchQuery('');
    if (targetNodes.length > 0) {
      setSelectedNode(targetNodes[0]);
      setSelectedLandParcel(targetNodes[0].landParcels[0] || null);
    }
  };

  // Custom Pin Location State
  const [customPin, setCustomPin] = useState<{ lat: number; lng: number; areaAcres: number } | null>(null);
  const [isPinDropperActive, setIsPinDropperActive] = useState<boolean>(false);

  // Comparison Matrix List
  const [compareList, setCompareList] = useState<LandParcel[]>([]);

  // Modal Feasibility State
  const [modalLand, setModalLand] = useState<LandParcel | null>(null);
  const [modalPMU, setModalPMU] = useState<PMUNode | null>(null);

  // System Architecture Schematics & User Manual Modals
  const [isSchematicsOpen, setIsSchematicsOpen] = useState<boolean>(false);
  const [isGlobalTnbLetterOpen, setIsGlobalTnbLetterOpen] = useState<boolean>(false);
  const [isUserManualOpen, setIsUserManualOpen] = useState<boolean>(false);
  const [isOpenDataOpen, setIsOpenDataOpen] = useState<boolean>(false);

  // Filter Logic
  const filteredNodes = nodes.filter((node) => {
    if (selectedState !== 'All' && node.state !== selectedState) return false;
    if (selectedVoltage !== 'All' && node.voltage !== selectedVoltage) return false;
    if (minCapacity > 0 && node.capacityMW < minCapacity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = node.name.toLowerCase().includes(q);
      const matchState = node.state.toLowerCase().includes(q);
      const matchDistrict = node.district.toLowerCase().includes(q);
      if (!matchName && !matchState && !matchDistrict) return false;
    }
    return true;
  });

  const handleSelectNode = (node: PMUNode) => {
    setSelectedNode(node);
    if (node.landParcels.length > 0) {
      setSelectedLandParcel(node.landParcels[0]);
    } else {
      setSelectedLandParcel(null);
    }
  };

  const handleSelectLandParcel = (land: LandParcel, pmuNode?: PMUNode) => {
    setSelectedLandParcel(land);
    if (pmuNode) {
      setSelectedNode(pmuNode);
    }
  };

  const handleAddToCompare = (item: PMUNode | LandParcel) => {
    let landToAdd: LandParcel;
    if ('pmuId' in item) {
      landToAdd = item as LandParcel;
    } else {
      landToAdd = (item as PMUNode).landParcels[0];
    }

    if (landToAdd && !compareList.some((c) => c.id === landToAdd.id)) {
      if (compareList.length >= 3) {
        alert('You can compare up to 3 candidate land plots at a time.');
        return;
      }
      setCompareList([...compareList, landToAdd]);
    }
  };

  const handleRemoveFromCompare = (id: string) => {
    setCompareList(compareList.filter((c) => c.id !== id));
  };

  const handleClearCompare = () => {
    setCompareList([]);
  };

  const handleOpenFeasibilityModal = (land: LandParcel, pmuNode: PMUNode) => {
    setModalLand(land);
    setModalPMU(pmuNode);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Navigation & Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPackage={selectedPackage}
        setSelectedPackage={handlePackageChange}
        onOpenPackageSelector={() => setIsPackageSelectorOpen(true)}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        selectedVoltage={selectedVoltage}
        setSelectedVoltage={setSelectedVoltage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        minCapacity={minCapacity}
        setMinCapacity={setMinCapacity}
        totalNodeCount={nodes.length}
        filteredNodeCount={filteredNodes.length}
        allNodes={nodes}
        filteredNodes={filteredNodes}
        selectedNode={selectedNode}
        onSelectNode={handleSelectNode}
        onOpenSchematics={() => setIsSchematicsOpen(true)}
        onDownloadReadme={() => downloadPlatformReadme()}
        onExportReadmePdf={() => exportPlatformReadmePdf()}
        onOpenTnbLetter={() => setIsGlobalTnbLetterOpen(true)}
        onOpenUserManual={() => setIsUserManualOpen(true)}
        onOpenOpenData={() => setIsOpenDataOpen(true)}
      />

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* TAB 1: GIS Map & PMU Details View */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Interactive GIS Map (7 cols on large screens) */}
              <div className="lg:col-span-7 space-y-4">
                <InteractiveMap
                  nodes={filteredNodes}
                  selectedNode={selectedNode}
                  onSelectNode={handleSelectNode}
                  selectedLandParcel={selectedLandParcel}
                  onSelectLandParcel={handleSelectLandParcel}
                  customPin={customPin}
                  onSetCustomPin={setCustomPin}
                  isPinDropperActive={isPinDropperActive}
                  setIsPinDropperActive={setIsPinDropperActive}
                  onAnalyzeFeasibility={handleOpenFeasibilityModal}
                />
              </div>

              {/* Selected PMU Node Profile & Nearby Suitable Land Plots (5 cols) */}
              <div className="lg:col-span-5">
                <PMUNodeDetails
                  node={selectedNode}
                  selectedLandParcel={selectedLandParcel}
                  allNodes={nodes}
                  onSelectNode={handleSelectNode}
                  onSelectLandParcel={setSelectedLandParcel}
                  onAnalyzeFeasibility={handleOpenFeasibilityModal}
                  onAddToCompare={handleAddToCompare}
                />
              </div>
            </div>

            {/* PMU Nodes Grid Selector List */}
            <div className="bg-white border border-slate-300 rounded p-5 space-y-4 shadow-sm font-sans">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" /> Designated LSS6 Interconnection Nodes Index
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Showing {filteredNodes.length} of {nodes.length} PMUs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const is275kV = node.voltage === '275kV';
                  const is33kV = node.voltage === '33kV';
                  const currentLoad = node.currentLoadMW ?? Math.round(node.capacityMW * 0.7);
                  const utilPct = node.capacityUtilizationPct ?? Math.round((currentLoad / node.capacityMW) * 100);

                  let statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  let barFillClass = 'bg-emerald-500';

                  if (utilPct >= 85) {
                    statusBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
                    barFillClass = 'bg-rose-500';
                  } else if (utilPct >= 70) {
                    statusBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                    barFillClass = 'bg-amber-500';
                  }

                  const voltageBadgeClass = is275kV
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : is33kV
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                  return (
                    <div
                      key={node.id}
                      onClick={() => handleSelectNode(node)}
                      className={`p-3 rounded border transition-all cursor-pointer font-mono ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-500'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] text-slate-500 font-bold">#{node.number}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${voltageBadgeClass}`}>
                          {node.voltage}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1 font-sans">
                        PMU {node.name}
                        {node.isPendingApplication && <span className="text-amber-600 text-[10px] font-black">**</span>}
                      </div>

                      <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between font-sans">
                        <span>{node.state}</span>
                        <strong className="text-slate-900 font-bold">{node.capacityMW} MW Max</strong>
                      </div>

                      {/* Capacity Utilization Badge & Progress Bar */}
                      <div className="mt-2 pt-2 border-t border-slate-200/80 font-sans">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-semibold text-slate-500">Capacity Utilization</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${statusBadgeClass}`}>
                            {utilPct}% ({currentLoad} / {node.capacityMW} MW)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${barFillClass}`}
                            style={{ width: `${utilPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: App Proposed Solar Farm Lands */}
        {activeTab === 'proposed' && (
          <ProposedLandsSection
            nodes={nodes}
            onSelectNode={handleSelectNode}
            onSelectLandParcel={(land, pmu) => handleSelectLandParcel(land, pmu)}
            onAnalyzeFeasibility={handleOpenFeasibilityModal}
            onAddToCompare={handleAddToCompare}
            onSwitchToMapTab={() => setActiveTab('map')}
          />
        )}

        {/* TAB 3: Custom Pin Dropper & Distance Calculator */}
        {activeTab === 'custom' && (
          <CustomLandCalculator
            nodes={nodes}
            customPin={customPin}
            onSetCustomPin={setCustomPin}
            onAnalyzeFeasibility={handleOpenFeasibilityModal}
            isPinDropperActive={isPinDropperActive}
            setIsPinDropperActive={setIsPinDropperActive}
          />
        )}

        {/* TAB 4: Dedicated Quick-Check MW Capacity Table Tool */}
        {activeTab === 'capacity' && (
          <PMUCapacityTable
            nodes={filteredNodes}
            onSelectNode={(node) => {
              handleSelectNode(node);
              setActiveTab('map');
            }}
            onSwitchToMapTab={() => setActiveTab('map')}
          />
        )}

        {/* TAB 5: Grid Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            nodes={nodes}
            onSelectNode={(node) => {
              handleSelectNode(node);
              setActiveTab('map');
            }}
            onSwitchToMapTab={() => setActiveTab('map')}
          />
        )}

        {/* TAB 4: Site Comparison Matrix */}
        {activeTab === 'compare' && (
          <NodeComparer
            compareList={compareList}
            onRemoveFromCompare={handleRemoveFromCompare}
            onClearCompare={handleClearCompare}
            onAnalyzeFeasibility={handleOpenFeasibilityModal}
            allNodes={nodes}
          />
        )}
      </main>

      {/* Program / Package Landing Selector Modal */}
      <PackageLandingModal
        isOpen={isPackageSelectorOpen}
        onClose={() => setIsPackageSelectorOpen(false)}
        selectedPackage={selectedPackage}
        onSelectPackage={(pkg) => {
          handlePackageChange(pkg);
          setIsPackageSelectorOpen(false);
        }}
      />

      {/* Feasibility Assessment Report Modal */}
      {modalLand && modalPMU && (
        <LandFeasibilityModal
          land={modalLand}
          pmuNode={modalPMU}
          onClose={() => {
            setModalLand(null);
            setModalPMU(null);
          }}
        />
      )}

      {/* System Architecture Schematics Modal */}
      <SystemArchitectureModal
        isOpen={isSchematicsOpen}
        onClose={() => setIsSchematicsOpen(false)}
      />

      {/* TNB Headroom Verification Letter Modal */}
      <TnbEnquiryLetterModal
        isOpen={isGlobalTnbLetterOpen}
        onClose={() => setIsGlobalTnbLetterOpen(false)}
        pmuName={selectedNode?.name || 'Bakri'}
        capacityMW={`${selectedNode?.capacityMW || 50} MW`}
        pmuVoltage={selectedNode?.voltage || '132kV'}
        pmuState={selectedNode?.state || 'Johor'}
      />

      {/* Interactive Application User Manual & Guide Modal */}
      <UserManualModal
        isOpen={isUserManualOpen}
        onClose={() => setIsUserManualOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenTnbLetter={() => setIsGlobalTnbLetterOpen(true)}
        onOpenSchematics={() => setIsSchematicsOpen(true)}
        onOpenOpenData={() => setIsOpenDataOpen(true)}
      />

      {/* OpenGIS & JUPEM Data Integration Modal */}
      <OpenDataIntegrationModal
        isOpen={isOpenDataOpen}
        onClose={() => setIsOpenDataOpen(false)}
        selectedState={selectedState !== 'All' ? selectedState : 'Kedah'}
        selectedDistrict={selectedNode?.district || 'Kuala Muda'}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-4 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-2 mt-auto font-mono">
        <div>
          LSS6 {selectedPackage === 'package3' ? 'SOLAR (PACKAGE 3 - BUMIPUTERA)' : 'HYBRID (PACKAGES 1 & 2)'} RFP &bull; Designated Interconnection Nodes & Solar Feasibility Engine &bull; Peninsular Malaysia
        </div>
        <div className="text-slate-300">
          Powered by Gemini AI Studio & Interconnection Grid GIS Data
        </div>
      </footer>
    </div>
  );
}
