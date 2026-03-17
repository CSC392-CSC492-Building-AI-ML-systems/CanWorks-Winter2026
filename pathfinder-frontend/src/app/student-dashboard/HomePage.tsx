import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { Card } from '@/app/components/globalComponents';
import { JobCard } from '@/app/components/JobCard';
import { BarChart3, Bookmark, Bell, ChevronLeft, ChevronRight, Sliders } from 'lucide-react';
import { mockJobs } from '@/data/mockData';
import type { JobPosting } from '@/types';
import { useSavedJobs } from '@/app/hooks/useSavedJobs';

function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50"
    >
      <ChevronRight className="w-5 h-5" />
    </button>
  );
}

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  );
}

export function HomePage({ totalJobs = 0, recommendedJobs: propRecommended = undefined, recCount = 4, setRecCount = (n: number) => {} }: { totalJobs: number, recommendedJobs?: JobPosting[], recCount?: number, setRecCount?: (n: number) => void }) {
    const { savedJobDetails, toggleSave, loading } = useSavedJobs();
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [tempRecCount, setTempRecCount] = React.useState<number>(recCount);

    if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading saved jobs...</p>
      </div>
    );
  }

    // useEffect(() => {
    //     localStorage.setItem('savedJobs', JSON.stringify(Array.from(savedJobs)));
    // }, [savedJobs]);

    // const toggleSave = (jobId: string) => {
    //     setSavedJobs(prev => {
    //     const next = new Set(prev);
    //     if (next.has(jobId)) next.delete(jobId);
    //     else next.add(jobId);
    //     return next;
    //     });
    // };

    const recommendedJobs = propRecommended && propRecommended.length > 0 ? propRecommended : mockJobs.slice(0, 4);
    const wildcardJobs = mockJobs.slice(4);

    const carouselSettings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm text-gray-600">Job Postings</h3>
            </div>
            <p className="text-3xl">{totalJobs}</p>
            </Card>

            <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                <Bookmark className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-sm text-gray-600">Saved Jobs</h3>
            </div>
            <p className="text-3xl">{savedJobDetails?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Ready to apply</p>
            </Card>

            <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                <Bell className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm text-gray-600">Active Alerts</h3>
            </div>
            <p className="text-3xl">3</p>
            <p className="text-sm text-gray-500 mt-1">Followed searches</p>
            </Card>
        </div>
        
        <section>
        <h2 className="text-2xl mb-6">Saved Jobs</h2>

        {savedJobDetails.length === 0 ? (
          <p className="text-gray-600">You have no saved jobs right now.</p>
        ) : (
          <Slider {...carouselSettings}>
            {savedJobDetails.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={true}
                onToggleSave={toggleSave}
              />
            ))}
          </Slider>
        )}
      </section>
      
        {/* Recommended For You Carousel */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl mb-6">Recommended For You</h2>
            <div className="relative">
              <button
                className="inline-flex items-center gap-2 px-3 py-1.5 border rounded bg-white"
                onClick={() => { setFiltersOpen((s) => !s); setTempRecCount(recCount); }}
                aria-expanded={filtersOpen}
              >
                <Sliders className="w-4 h-4" />
                <span className="text-sm">Filters</span>
              </button>

              {filtersOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg p-4 z-30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Recommendation Filters</h3>
                    <button className="text-sm text-gray-500" onClick={() => { setFiltersOpen(false); setTempRecCount(recCount); }}>Close</button>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs text-gray-600">Number of recommendations: <span className="font-medium">{tempRecCount}</span></label>
                    <input
                      type="range"
                      min={1}
                      max={Math.max(1, Math.min(totalJobs || 50, 50))}
                      value={tempRecCount}
                      onChange={(e) => setTempRecCount(Number((e.target as HTMLInputElement).value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      className="px-3 py-1 rounded border bg-white text-sm"
                      onClick={() => { setFiltersOpen(false); setTempRecCount(recCount); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                      onClick={() => { setRecCount(tempRecCount); setFiltersOpen(false); }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="relative px-12">
          <Slider {...carouselSettings}>
            {recommendedJobs.map((job) => (
            <div key={job.id} className="px-2">
              <JobCard
              job={job}
              isSaved={savedJobDetails?.some(j => j.id === job.id) || false}
              onToggleSave={toggleSave}
              />
            </div>
            ))}
          </Slider>
          </div>
        </section>

        {/* Wildcard Carousel */}
        <section>
            <h2 className="text-2xl mb-6">Wildcard Opportunities</h2>
            <p className="text-gray-600 mb-6">
            Roles that match your skills but might be outside your usual search
            </p>
            <div className="relative px-12">
            <Slider {...carouselSettings}>
                {wildcardJobs.map((job) => (
                <div key={job.id} className="px-2">
                    <JobCard
                    job={job}
                    isSaved={savedJobDetails?.some(j => j.id === job.id) || false}
                    onToggleSave={toggleSave}
                    />
                </div>
                ))}
            </Slider>
            </div>
        </section>
        </div>
    );
}
