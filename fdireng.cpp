// =============================================================================
// FDIR Engine — Fault Detection, Isolation & Recovery
// Triple Modular Redundancy (TMR) + DFA State Machine
// Standard: C++17
// =============================================================================

#include <iostream>
#include <array>
#include <algorithm>
#include <cmath>
#include <string>
#include <optional>
#include <iomanip>

// =============================================================================
// SECTION 1 — State Definitions (DFA)
// =============================================================================

enum class SystemState {
    NOMINAL,     // All 3 sensors agree — full data confidence
    DEGRADED,    // 1 sensor failed — running on 2 remaining sensors
    SAFE_MODE,   // 2+ sensors failed — system locked to protect hardware
    RECOVERING   // Attempting to reset a faulty sensor
};

std::string stateToString(SystemState s) {
    switch (s) {
        case SystemState::NOMINAL:    return "NOMINAL";
        case SystemState::DEGRADED:   return "DEGRADED";
        case SystemState::SAFE_MODE:  return "SAFE_MODE";
        case SystemState::RECOVERING: return "RECOVERING";
    }
    return "UNKNOWN";
}

// =============================================================================
// SECTION 2 — Telemetry Packet
// =============================================================================

struct TelemetryPacket {
    float sensor[3];        // Raw readings from S1, S2, S3
    bool  fault[3];         // Fault flags per sensor
    float votedValue;       // TMR-elected "truth" value
    int   faultCount;       // Number of faulty sensors this cycle
    SystemState state;      // Current DFA state
    std::string message;    // Human-readable status
};

// =============================================================================
// SECTION 3 — TMR Voter Logic
// =============================================================================
//
// Algorithm:
//   For every pair (i, j), check if |sensor[i] - sensor[j]| <= threshold.
//   A sensor is "valid" if it agrees with at least one other sensor.
//   The voted value is the average of all valid sensors.
//   If no pair agrees, all sensors are marked faulty.

struct VoterResult {
    bool  fault[3];
    float votedValue;
    int   faultCount;
};

VoterResult runTMRVoter(float s0, float s1, float s2, float threshold = 5.0f) {
    const std::array<float, 3> s = { s0, s1, s2 };
    VoterResult result = {};

    // Agreement matrix: agrees[i][j] = true if sensor i and j are within threshold
    bool agrees[3][3] = {};
    for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j)
            agrees[i][j] = (std::fabs(s[i] - s[j]) <= threshold);

    // A sensor is valid if it agrees with at least one *other* sensor
    bool valid[3] = {};
    for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j)
            if (i != j && agrees[i][j]) valid[i] = true;

    // Sum valid readings for voted average
    float sum   = 0.0f;
    int   count = 0;
    for (int i = 0; i < 3; ++i) {
        result.fault[i] = !valid[i];
        if (valid[i]) { sum += s[i]; ++count; }
    }

    // Edge case: no two sensors agree at all → flag all, use median as best-effort
    if (count == 0) {
        std::array<float, 3> sorted = { s[0], s[1], s[2] };
        std::sort(sorted.begin(), sorted.end());
        result.votedValue = sorted[1];   // median
        result.fault[0] = result.fault[1] = result.fault[2] = true;
        result.faultCount = 3;
    } else {
        result.votedValue = sum / static_cast<float>(count);
        result.faultCount = 0;
        for (int i = 0; i < 3; ++i)
            if (result.fault[i]) ++result.faultCount;
    }

    return result;
}

// =============================================================================
// SECTION 4 — FDIR Engine (DFA)
// =============================================================================

class FDIREngine {
public:
    // Voting threshold: sensors within ±5.0 units are considered in agreement
    static constexpr float THRESHOLD      = 5.0f;
    // After this many RECOVERING cycles without success, force SAFE_MODE
    static constexpr int   RECOVERY_LIMIT = 3;

    FDIREngine() : currentState_(SystemState::NOMINAL), recoveryCycles_(0) {}

    // -------------------------------------------------------------------------
    // Primary entry point: feed three sensor readings, get a TelemetryPacket
    // -------------------------------------------------------------------------
    TelemetryPacket process(float s1, float s2, float s3) {
        VoterResult voter = runTMRVoter(s1, s2, s3, THRESHOLD);

        TelemetryPacket pkt;
        pkt.sensor[0]  = s1;
        pkt.sensor[1]  = s2;
        pkt.sensor[2]  = s3;
        pkt.votedValue = voter.votedValue;
        pkt.faultCount = voter.faultCount;
        for (int i = 0; i < 3; ++i) pkt.fault[i] = voter.fault[i];

        // ---- DFA Transition Logic ----
        transition(voter.faultCount);

        pkt.state   = currentState_;
        pkt.message = buildMessage(voter);
        return pkt;
    }

    // Simulate an operator-commanded sensor reset (triggers RECOVERING state)
    void commandReset() {
        if (currentState_ == SystemState::DEGRADED ||
            currentState_ == SystemState::SAFE_MODE) {
            currentState_   = SystemState::RECOVERING;
            recoveryCycles_ = 0;
            std::cout << "[CMD] Reset commanded — entering RECOVERING state.\n";
        }
    }

    SystemState getState() const { return currentState_; }

private:
    SystemState currentState_;
    int         recoveryCycles_;

    // ---- DFA Transition Table ------------------------------------------------
    //
    //  NOMINAL    + 0 faults  → NOMINAL
    //  NOMINAL    + 1 fault   → DEGRADED
    //  NOMINAL    + 2+ faults → SAFE_MODE
    //
    //  DEGRADED   + 0 faults  → NOMINAL     (self-heal)
    //  DEGRADED   + 1 fault   → DEGRADED
    //  DEGRADED   + 2+ faults → SAFE_MODE
    //
    //  SAFE_MODE  (locked — only operator reset can transition out)
    //
    //  RECOVERING + 0 faults  → NOMINAL     (success)
    //  RECOVERING + 1 fault   → DEGRADED    (partial recovery)
    //  RECOVERING + 2+ faults → SAFE_MODE   (recovery failed)
    //  RECOVERING + limit     → SAFE_MODE   (timeout)
    // -------------------------------------------------------------------------
    void transition(int faultCount) {
        switch (currentState_) {

            case SystemState::NOMINAL:
                if      (faultCount == 0) currentState_ = SystemState::NOMINAL;
                else if (faultCount == 1) currentState_ = SystemState::DEGRADED;
                else                      currentState_ = SystemState::SAFE_MODE;
                break;

            case SystemState::DEGRADED:
                if      (faultCount == 0) currentState_ = SystemState::NOMINAL;
                else if (faultCount == 1) currentState_ = SystemState::DEGRADED;
                else                      currentState_ = SystemState::SAFE_MODE;
                break;

            case SystemState::SAFE_MODE:
                // Locked — no automatic transitions.
                // Use commandReset() to enter RECOVERING.
                break;

            case SystemState::RECOVERING:
                ++recoveryCycles_;
                if (recoveryCycles_ >= RECOVERY_LIMIT) {
                    currentState_ = SystemState::SAFE_MODE;
                } else if (faultCount == 0) {
                    currentState_   = SystemState::NOMINAL;
                    recoveryCycles_ = 0;
                } else if (faultCount == 1) {
                    currentState_   = SystemState::DEGRADED;
                    recoveryCycles_ = 0;
                } else {
                    currentState_ = SystemState::SAFE_MODE;
                }
                break;
        }
    }

    std::string buildMessage(const VoterResult& v) {
        std::string msg = "[" + stateToString(currentState_) + "] ";
        if (v.faultCount == 0) {
            msg += "All sensors nominal. Voted value accepted.";
        } else {
            msg += "Faulty sensor(s): ";
            for (int i = 0; i < 3; ++i)
                if (v.fault[i]) msg += "S" + std::to_string(i + 1) + " ";
            msg += "| Voted value from remaining sensors.";
        }
        return msg;
    }
};

// =============================================================================
// SECTION 5 — Display Helper
// =============================================================================

void printPacket(const TelemetryPacket& pkt, int cycle) {
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "----------------------------------------\n";
    std::cout << " Cycle #" << cycle << "\n";
    std::cout << " Inputs  : S1=" << pkt.sensor[0]
              << "  S2=" << pkt.sensor[1]
              << "  S3=" << pkt.sensor[2] << "\n";
    std::cout << " Faults  : S1=" << (pkt.fault[0] ? "FAIL" : "OK  ")
              << "  S2=" << (pkt.fault[1] ? "FAIL" : "OK  ")
              << "  S3=" << (pkt.fault[2] ? "FAIL" : "OK  ") << "\n";
    std::cout << " Voted   : " << pkt.votedValue << "\n";
    std::cout << " Status  : " << pkt.message << "\n";
}

// =============================================================================
// SECTION 6 — Simulation (main)
// =============================================================================

int main() {
    FDIREngine engine;

    std::cout << "\n=== FDIR ENGINE — TMR + DFA SIMULATION ===\n\n";

    // --- Scenario A: All sensors agree (NOMINAL) ---
    std::cout << ">> Scenario A: All sensors nominal\n";
    printPacket(engine.process(25.0f, 25.3f, 24.8f), 1);

    // --- Scenario B: One sensor drifts (DEGRADED) ---
    std::cout << "\n>> Scenario B: S3 drifts far out of range\n";
    printPacket(engine.process(25.0f, 25.3f, 999.0f), 2);

    // --- Scenario C: Still degraded, S3 still stuck ---
    std::cout << "\n>> Scenario C: S3 still bad, system remains DEGRADED\n";
    printPacket(engine.process(25.1f, 25.4f, 999.0f), 3);

    // --- Scenario D: Operator commands reset → RECOVERING ---
    std::cout << "\n>> Scenario D: Operator issues reset command\n";
    engine.commandReset();
    printPacket(engine.process(25.2f, 25.5f, 25.1f), 4);   // S3 recovered

    // --- Scenario E: Back to NOMINAL after recovery ---
    std::cout << "\n>> Scenario E: All sensors back online → NOMINAL\n";
    printPacket(engine.process(26.0f, 26.1f, 25.9f), 5);

    // --- Scenario F: Two sensors fail simultaneously → SAFE_MODE ---
    std::cout << "\n>> Scenario F: Two sensors fail → SAFE_MODE\n";
    printPacket(engine.process(25.0f, -500.0f, 999.0f), 6);

    // --- Scenario G: Even with good data, SAFE_MODE is locked ---
    std::cout << "\n>> Scenario G: SAFE_MODE locked even with good readings\n";
    printPacket(engine.process(25.0f, 25.1f, 25.2f), 7);

    // --- Scenario H: Reset from SAFE_MODE ---
    std::cout << "\n>> Scenario H: Operator resets from SAFE_MODE\n";
    engine.commandReset();
    printPacket(engine.process(25.0f, 25.1f, 25.2f), 8);   // all good → NOMINAL

    std::cout << "----------------------------------------\n";
    std::cout << "\nFinal state: " << stateToString(engine.getState()) << "\n\n";
    return 0;
}
