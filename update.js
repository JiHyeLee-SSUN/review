let updateModal = {
  beforeData: undefined,
  init: function () {
    /**
     * 수정 페이지 이동 이벤트
     * 모달 팝업 및 값 세팅
     */
    $(document).on("click", ".fas.fa-hammer", function (event) {
      $("#updateModal").modal({
        backdrop: false,
        show: true,
        fadeDuration: 100,
        background: "black",
      });
      updateModal.clearInput();
      updateModal.settingInput(event.target.closest("tr"));
    });
    /**
     * 모달 close 이벤트
     */
    $(".fas.fa-window-close").on("click", async function () {
      $("#updateModal").modal("hide");
      // 화면 초기화
      let json = await getAPI(apiUrl + "/api/port", "GET");
      await portContent(json);
    });
    /**
     * 검증 이벤트
     * 수정하기 전 중복여부 확인
     */
    document.querySelector("#validate").addEventListener("click", function () {
      let departureIp = document.querySelector(".departureIp").innerText;
      let arrivalIp = document.querySelector(".arrivalIp").innerText;
      let arrivalPort = document.querySelector(".arrivalPort").innerText;

      if (!departureIp && !arrivalIp && !arrivalPort) {
        alert("입력값 누락");
        return false;
      }
      updateModal.validate();
    });

    document.querySelector("#edit").addEventListener("click", function () {
      validateNode(false);
    });

    document.querySelector("#update").addEventListener("click", function () {
      updateModal.updateNode();
    });
  },
  /**
   * 모달값 초기화
   */
  clearInput: function () {
    document.querySelector("#update_dip").value = "";
    document.querySelector("#update_aip").value = "";
    document.querySelector("#update_port").value = "";
    document.querySelector("#update_needed").checked = false;
  },
  /**
   * 수정값 초기화
   * @param {Element} selector 대상 tr element
   */
  settingInput: function (selector) {
    let departureIp = selector.querySelector(".departureIp").innerText;
    let arrivalIp = selector.querySelector(".arrivalIp").innerText;
    let arrivalPort = selector.querySelector(".arrivalPort").innerText;
    let needed = selector.querySelector(".needed").innerText;

    document.querySelector("#update_dip").value = departureIp;
    document.querySelector("#update_aip").value = arrivalIp;
    document.querySelector("#update_port").value = arrivalPort;
    document.querySelector("#update_needed").checked =
      needed === "Y" ? true : false;

    updateModal.beforeData = {
      departureIp: departureIp,
      arrivalIp: arrivalIp,
      arrivalPort: arrivalPort,
      needed: needed === "Y" ? 1 : 0,
    };
  },
  /**
   * 포트 update전 이미 등록된 포트목록인지 검증하는 함수
   * @param event
   */
  validate: async (event) => {
    let result;
    let param = {
      departureIp: document.querySelector("#update_dip").value,
      arrivalIp: document.querySelector("#update_aip").value,
      arrivalPort: document.querySelector("#update_port").value,
    };

    await getAPI(apiUrl + "/api/port/validate", "POST", param).then(function (
      res
    ) {
      if (res.error != undefined) {
        alertError(res);
      } else {
        if (res.port[0].count == 0) {
          validateNode(true);
        } else {
          alert("이미 존재하는 자원입니다.");
          return false;
        }
      }
    });
  },
  /**
   * 포트 update
   */
  updateNode: async function () {
    let param = {
      before: updateModal.beforeData,
      after: {
        departureIp: document.querySelector("#update_dip").value,
        arrivalIp: document.querySelector("#update_aip").value,
        arrivalPort: document.querySelector("#update_port").value,
        needed: document.querySelector("#update_needed").checked ? "1" : "0",
      },
    };
    await getAPI(apiUrl + "/api/port/update", "PATCH", param).then(function (
      res
    ) {
      if (res.error != undefined) {
        alertError(res);
      } else if (res.port[0].count > 0) {
        alert("update complete");

        updateModal.beforeData = {
          departureIp: param.departureIp,
          arrivalIp: param.arrivalIp,
          arrivalPort: param.arrivalPort,
          needed: param.needed,
        };
      }
    });
  },
};

/**
 * 검증된 목록을 검증완료로 변환하는 함수
 * @param {boolean} disabled 비활성화 여부
 */
function validateNode(disabled) {
  document.querySelector("#update_dip").disabled = disabled;
  document.querySelector("#update_aip").disabled = disabled;
  document.querySelector("#update_port").disabled = disabled;
  document.querySelector("#update_needed").disabled = disabled;

  document.querySelector("#validate").style.display = disabled
    ? "none"
    : "initial";
  document.querySelector("#edit").style.display = disabled ? "initial" : "none";
  document.querySelector("#update").style.display = disabled
    ? "initial"
    : "none";
}
